import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String
    },
    content: String,
    isRead: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

export const Notifications = mongoose.model("Notifications", notificationSchema);