import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Notifications } from "../schemas/notification.models.js";

export const getAllNotifications = catchAsyncErrors(async (req, res, next) => {
    const notifications = await Notifications.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean();
    
    res.status(200).json({
        success: true,
        message: "Notifications fetched successfully",
        notifications
    });
});

export const markedAsRead = catchAsyncErrors(async (req, res, next) => {
    const notification = await Notifications.findById(req.params.id);
    
    if (!notification) {
        return res.status(404).json({
            success: false,
            message: "Notification not found"
        });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Not authorized to mark this notification as read"
        });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
        success: true,
        message: "Notification marked as read successfully"
    });
});

export const markAllAsRead = catchAsyncErrors(async (req, res, next) => {
    await Notifications.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        success: true,
        message: "All notifications marked as read successfully"
    });
});

export const getUnreadCount = catchAsyncErrors(async (req, res, next) => {
    const count = await Notifications.countDocuments({
        user: req.user._id,
        isRead: false
    });

    res.status(200).json({
        success: true,
        unreadCount: count
    });
});