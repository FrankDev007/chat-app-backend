import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../schemas/user.models.js";

const connectedUsers = new Map(); // Track connected users

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Store connected user
    connectedUsers.set(socket.userId, socket.id);
    
    // Join user to their personal room
    socket.join(socket.userId);
    
    // Update user online status
    updateUserOnlineStatus(socket.userId, true);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      connectedUsers.delete(socket.userId);
      updateUserOnlineStatus(socket.userId, false);
    });
  });

  // Helper function to check if user is connected
  io.isUserConnected = (userId) => {
    return connectedUsers.has(userId);
  };

  // Helper function to emit to specific user
  io.emitToUser = (userId, event, data) => {
    if (connectedUsers.has(userId)) {
      io.to(userId).emit(event, data);
      return true;
    }
    return false;
  };

  return io;
};

// Helper function to update user online status
const updateUserOnlineStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: isOnline ? null : new Date()
    });
  } catch (error) {
    console.error("Error updating user online status:", error);
  }
};