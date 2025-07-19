import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getAllNotifications, getUnreadCount, markAllAsRead, markedAsRead } from "../controllers/notification.controllers.js";

const router = express.Router();

router.get("/getall", isAuthenticated, getAllNotifications);
router.patch("/markasread/:id", isAuthenticated, markedAsRead);
router.patch("/markallasread", isAuthenticated, markAllAsRead);
router.get("/unreadcount", isAuthenticated, getUnreadCount);

export default router;