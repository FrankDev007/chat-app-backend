import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Notifications } from "../schemas/notification.models.js";
import { User } from "../schemas/user.models.js";

export const sendFriendRequest = catchAsyncErrors(async (req, res) => {
    const senderId = req.user._id.toString();
    const receiverId = req.params.id;

    if (senderId === receiverId) {
        return res.status(400).json({ success: false, message: "You can't add yourself" });
    }

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (receiver.friendRequests.includes(senderId)) {
        return res.status(400).json({ success: false, message: "Request already sent" });
    }

    if (receiver.friends.includes(senderId)) {
        return res.status(400).json({ success: false, message: "Already friends" });
    }

    receiver.friendRequests.push(senderId);
    await receiver.save();

    // Create notification in database
    const notification = await Notifications.create({
        user: receiver._id,
        content: `${sender.name} sent you a friend request`,
        type: "FRIEND_REQUEST"
    });

    // Emit real-time notification if user is connected
    if (req.io && req.io.isUserConnected(receiverId)) {
        req.io.emitToUser(receiverId, "receive_friend_request", {
            from: senderId,
            fromName: sender.name,
            fromAvatar: sender.avatar,
            notification: {
                _id: notification._id,
                type: "FRIEND_REQUEST",
                content: `${sender.name} sent you a friend request`,
                createdAt: notification.createdAt,
                isRead: false
            },
        });
    }

    res.status(200).json({ success: true, message: "Friend request sent" });
});

export const acceptFriendRequest = catchAsyncErrors(async (req, res, next) => {
    const receiverId = req.user._id.toString();
    const senderId = req.params.id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (!receiver.friendRequests.includes(senderId)) {
        return res.status(404).json({ success: false, message: "Friend request not found" });
    }

    receiver.friends.push(senderId);
    sender.friends.push(receiverId);
    receiver.friendRequests = receiver.friendRequests.filter((id) => id.toString() !== senderId);
    
    await receiver.save();
    await sender.save();

    // Create notification in database
    const notification = await Notifications.create({
        user: senderId,
        content: `${receiver.name} accepted your friend request.`,
        type: "FRIEND_ACCEPTED"
    });

    // Emit real-time notification if user is connected
    if (req.io && req.io.isUserConnected(senderId)) {
        req.io.emitToUser(senderId, 'friend_request_accepted', {
            from: receiverId,
            fromName: receiver.name,
            fromAvatar: receiver.avatar,
            notification: {
                _id: notification._id,
                type: "FRIEND_ACCEPTED",
                content: `${receiver.name} accepted your friend request.`,
                createdAt: notification.createdAt,
                isRead: false
            },
        });
    }

    res.status(200).json({
        success: true,
        message: "Friend request accepted successfully"
    });
});

export const declineFriendRequest = catchAsyncErrors(async (req, res, next) => {
    const receiverId = req.user._id.toString();
    const senderId = req.params.id;

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (senderId === receiverId) {
        return res.status(400).json({ success: false, message: "You can't decline your own friend request" });
    }

    if (!receiver) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const isRequestExist = receiver.friendRequests.some(id => id.toString() === senderId);
    if (!isRequestExist) {
        return res.status(404).json({ success: false, message: "No friend request to decline" });
    }

    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);
    await receiver.save();

    // Emit real-time notification if user is connected
    if (req.io && req.io.isUserConnected(senderId)) {
        req.io.emitToUser(senderId, "friend_request_declined", {
            from: receiverId,
            fromName: receiver.name,
            message: "Your friend request was declined"
        });
    }

    res.status(200).json({
        success: true,
        message: "Friend request declined successfully"
    });
});

export const cancelFriendRequest = catchAsyncErrors(async (req, res, next) => {
    const senderId = req.user._id.toString();
    const receiverId = req.params.id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!receiver.friendRequests.includes(senderId)) {
        return res.status(400).json({ success: false, message: "No pending request to cancel" });
    }
    
    receiver.friendRequests = receiver.friendRequests.filter((id) => id.toString() !== senderId);
    await receiver.save();

    // Emit real-time notification if user is connected
    if (req.io && req.io.isUserConnected(receiverId)) {
        req.io.emitToUser(receiverId, "friend_request_cancelled", {
            from: senderId,
            fromName: sender.name,
            message: "Friend request was cancelled"
        });
    }

    res.status(200).json({
        success: true,
        message: "Friend request cancelled successfully"
    });
});

export const removeFriend = catchAsyncErrors(async (req, res, next) => {
    const currentUserId = req.user._id.toString();
    const friendId = req.params.id;

    const currentUser = await User.findById(currentUserId);
    const friend = await User.findById(friendId);

    if (!currentUser || !friend) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    currentUser.friends = currentUser.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== currentUserId);
    
    await currentUser.save();
    await friend.save();

    // Emit real-time notification if user is connected
    if (req.io && req.io.isUserConnected(friendId)) {
        req.io.emitToUser(friendId, "friend_removed", {
            from: currentUserId,
            fromName: currentUser.name,
            message: "You have been removed from friends list"
        });
    }

    res.status(200).json({
        success: true,
        message: "Friend removed successfully"
    });
});

export const getFindFriends = catchAsyncErrors(async (req, res, next) => {
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId).select("friends").lean();
    if (!currentUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const friendIds = Array.isArray(currentUser.friends) ? currentUser.friends : [];

    const friends = await User.find({
        _id: {
            $nin: [currentUserId, ...friendIds],
        },
    }).select("name email avatar").lean();

    res.status(200).json({
        success: true,
        friends,
        message: "Users fetched successfully",
    });
});

export const getAllFriends = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("friends", "name email avatar isOnline").lean();
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
        success: true,
        friends: user.friends,
        message: "Friends fetched successfully"
    });
});

export const getAllFriendRequests = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("friendRequests", "name email avatar").lean();
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({
        success: true,
        friendRequests: user.friendRequests,
        message: "Friend requests fetched successfully"
    })
});