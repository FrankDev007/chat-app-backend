import { User } from "../schemas/user.models.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import {Errorhandler } from "./Error.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    // ✅ Ensure req.cookies is defined
    if (!req.cookies || !req.cookies.token) {
        return next(new Errorhandler("User Not Authorized", 401));
    }

    // ✅ Extract token correctly
    const { token } = req.cookies;

    try { 
        // ✅ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next(new Errorhandler("User Not Found", 404));
        }

        next(); // ✅ Proceed to the next middleware
    } catch (error) {
        return next(new Errorhandler("Invalid or Expired Token", 401));
    }
});