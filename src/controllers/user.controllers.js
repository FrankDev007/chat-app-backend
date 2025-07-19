import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../schemas/user.models.js";
import { uploadImage } from "../utils/imagekit.js";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return next(
            res.status(400).json({
                success: false,
                message: "Please fill all fields"
            })
        )
    }
    const isEmail = await User.findOne({ email });
    if (isEmail) {
        return res.status(400).json({
            success: false,
            message: "Email already exists"
        });
    }
    let avatarData = {};
    if (req.file) {
        try {
            const fileName = `${email.split("@")[0]}_${Date.now()}`;
            const uploadResult = await uploadImage(
                req.file.buffer,
                fileName,
                "user-avatars"
            )
            avatarData = {
                public_id: uploadResult.public_id,
                url: uploadResult.url
            }

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Image upload failed"
            });

        }
    }
    const user = await User.create({
        name,
        email,
        password,
        avatar: avatarData
    })
    sendToken(user, 200, res, 'User Registered Successfully');
});

export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid UserName and Password"
        });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
        return res.status(400).json({
            success: false,
            message: "Invalid UserName and Password"
        });
    }
    sendToken(user, 200, res, "User Logged In Successfully");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
    return res.status(200).cookie("token", "", {
        httpOnly: true,
        expires: new Date(0), // Expire immediately
    }).json({
        success: true,
        message: "User Logged Out Successfully",
    });
});


export const getUser = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    return res.status(200).json({
        success: true,
        user
    });
})


export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const currentUserId = req.user._id;

  const currentUser = await User.findById(currentUserId).select("friends").lean();
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // ✅ Fix is here: define friendIds safely
  const friendIds = Array.isArray(currentUser.friends) ? currentUser.friends : [];

  const users = await User.find({
    _id: {
      $nin: [currentUserId, ...friendIds],
    },
  }).select("name email avatar").lean();

  res.status(200).json({
    success: true,
    users,
    message: "Users fetched successfully",
  });
});


export const findUsers = catchAsyncErrors(async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query parameter is required"
            });
        }
        const currentUserId = req.user._id;
        const currentUser = await User.findById(currentUserId).select("friends").lean();
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const users = await User.find(
            {
                _id: {
                    $nin: [
                        currentUserId,
                        currentUser.friends,
                    ]
                },
                $text: {
                    $search: query
                }
            },
            {
                score: {
                    $meta: "textScore"
                }
            }
        ).select("name email avatar").sort({ score: { $meta: "textScore" } }).limit(10);

        res.status(200).json({
            success: true,
            users,
            message: "Users fetched successfully"
        });

    } catch (error) {
        console.error("FindUsers Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

