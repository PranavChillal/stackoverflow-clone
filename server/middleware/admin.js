import user from "../models/auth.js";

export const adminOnly = async (
    req,
    res,
    next
) => {
    try {
        const foundUser =
            await user.findById(
                req.user.userId
            );

        if (!foundUser) {
            return res.status(404).json({
                message:
                    "User not found",
            });
        }

        if (
            foundUser.role !==
            "admin"
        ) {
            return res.status(403).json({
                message:
                    "Admin access required",
            });
        }

        next();
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};