import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [30, "Name must be at most 30 characters long"],
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters long"],
      maxlength: [30, "Password must be at most 30 characters long"],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        default: null,
        required: [true, "Public ID is required"]
      },
      url: {
        type: String,
        default: null,
        required: [true, "URL is required"]
      }
    }
  },
  { timestamps: true }
);

userSchema.pre("save" , async function(next) {
    if(!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password)
};

userSchema.methods.getJwtToken = function() {
    return jwt.sign({id: this._id}, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

userSchema.methods.getJWTrefreshToken = function() {
    return jwt.sign({id: this._id}, process.env.JWT_REFRESH_SECRET_KEY, {
        expiresIn: process.env.JWT_TOKEN_REFRESH_EXPIRE
    });
};

export const User = mongoose.model("User", userSchema);
