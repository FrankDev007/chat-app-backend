import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith("image/")) {
        return cb(null, true);
    } else {
        return cb(new Error("only images are allowed"), false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB
    }
});

export const uploadSingleImage = upload.single("avatar");
export const handleMulterError = (err,req,res,next) => {
    if(err instanceof multer.MulterError) {
        if(err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File size exceeds the limit of 5MB"
            });
        }
        return res.status(400).json({
            success: false,
            message: "File Upload Error",
            error: err.message
        })
    }

    if(err.message === "only images are allowed") {
        return res.status(400).json({
            success: false,
            message: "Only image files are allowed"
        });
    }

    next(err);
}
