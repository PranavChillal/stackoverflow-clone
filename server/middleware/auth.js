import jwt from "jsonwebtoken";
import user from "../models/auth.js";
import LoginSession from "../models/loginSession.js";

export const authenticate = async (
    req,
    res,
    next
) => {
    try {
        const token =
            req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message:
                    "Authentication required",
            });
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        /*
        |--------------------------------------------------------------------------
        | Session ID Check
        |--------------------------------------------------------------------------
        */

        if (!decoded.sessionId) {
            return res.status(401).json({
                message:
                    "Invalid session. Please log in again.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Find Active Session
        |--------------------------------------------------------------------------
        */

        const session =
            await LoginSession.findOne({
                _id:
                    decoded.sessionId,

                userId:
                    decoded.userId,

                revoked: false,

                expiresAt: {
                    $gt: new Date(),
                },
            });

        if (!session) {
            return res.status(401).json({
                message:
                    "Your session has expired or been revoked. Please log in again.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Inactivity Timeout
        |--------------------------------------------------------------------------
        |
        | Configure the timeout using:
        |
        | SESSION_INACTIVITY_MINUTES=30
        |
        | If no value is provided, 30 minutes is used.
        |
        */

        const inactivityMinutes =
            Number(
                process.env
                    .SESSION_INACTIVITY_MINUTES
            ) || 30;

        const inactivityLimit =
            inactivityMinutes *
            60 *
            1000;

        const now =
            new Date();

        const lastActivity =
            session.lastActivityAt ||
            session.loginAt ||
            session.createdAt;

        const inactiveFor =
            now.getTime() -
            new Date(
                lastActivity
            ).getTime();

        /*
        |--------------------------------------------------------------------------
        | Session Has Been Inactive Too Long
        |--------------------------------------------------------------------------
        */

        if (
            inactiveFor >=
            inactivityLimit
        ) {
            session.revoked =
                true;

            session.revokedAt =
                now;

            await session.save();

            return res.status(401).json({
                message:
                    "Your session expired due to inactivity. Please log in again.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Find User
        |--------------------------------------------------------------------------
        */

        const foundUser =
            await user.findById(
                decoded.userId
            );

        if (!foundUser) {
            return res.status(401).json({
                message:
                    "User account not found",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Suspended User
        |--------------------------------------------------------------------------
        */

        if (foundUser.suspended) {
            return res.status(403).json({
                message:
                    foundUser.suspensionReason ||
                    "Your account has been suspended.",

                suspended: true,
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Update Last Activity
        |--------------------------------------------------------------------------
        */

        session.lastActivityAt =
            now;

        await session.save();

        /*
        |--------------------------------------------------------------------------
        | Attach Authenticated User
        |--------------------------------------------------------------------------
        */

        req.user = {
            userId:
                decoded.userId,

            sessionId:
                decoded.sessionId,
        };

        next();
    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            message:
                "Invalid or expired session",
        });
    }
};