import express from "express"
import { findUsers, getAllUsers, getUser, login, logout, register } from "../controllers/user.controllers.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { handleMulterError, uploadSingleImage } from "../middlewares/multer.js";

const router = express.Router();
router.post('/register', uploadSingleImage, handleMulterError, register);
router.post('/login', login);
router.get('/logout', isAuthenticated, logout);
router.get('/getUser', isAuthenticated, getUser);
router.get('/getallusers', isAuthenticated, getAllUsers);
router.get('/findusers/search', isAuthenticated, findUsers);

export default router;