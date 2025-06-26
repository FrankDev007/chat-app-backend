export const sendToken = (user, statusCode, res, message) => {
    const token = user.getJwtToken();

    const expiresInDays = Number(process.env.COOKIE_EXPIRE) || 1;
    const options = {
        expires: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true, // always true in cross-origin setups (HTTPS)
        sameSite: "None", // <- change from "Strict" to "None"
    };

    res
        .status(statusCode)
        .cookie("token", token, options)
        .json({
            success: true,
            user,
            message,
            token,
        });
};

