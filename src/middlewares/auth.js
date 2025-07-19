// src/middlewares/auth.js
import { User } from "../schemas/user.models.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import { Errorhandler } from "./Error.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  let token;

  // ✅ Try to get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // ✅ Fallback to cookies if available
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new Errorhandler("User Not Authorized", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return next(new Errorhandler("User Not Found", 404));
    }

    next();
  } catch (error) {
    return next(new Errorhandler("Invalid or Expired Token", 401));
  }
});
