import http from "http";
import app, { injectSocket } from "./app.js";
import { initSocket } from "./src/utils/socket.js";

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
injectSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});