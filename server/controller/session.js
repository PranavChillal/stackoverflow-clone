import mongoose from "mongoose";

import LoginSession from "../models/loginSession.js";
import user from "../models/auth.js";

const getSessionResponse = (session) => {
    return {
        _id: session._id,

        userId: session.userId,

        browser:
            session.browser,

        operatingSystem:
            session.operatingSystem,

        deviceType:
            session.deviceType,

        ipAddress:
            session.ipAddress,

        location:
            session.location,

        loginAt:
            session.loginAt,

        lastActivityAt:
            session.lastActivityAt,

        trustedDevice:
            session.trustedDevice,

        revoked:
            session.revoked,

        revokedAt:
            session.revokedAt,

        expiresAt:
            session.expiresAt,

        current: false,
    };
};

/*
|--------------------------------------------------------------------------
| Get My Active Sessions
|--------------------------------------------------------------------------
*/

export const getMySessions =
    async (req, res) => {
        try {
            const userId =
                req.user.userId;

            const currentSessionId =
                req.user.sessionId;

            /*
            |--------------------------------------------------------------------------
            | Remove expired sessions
            |--------------------------------------------------------------------------
            */

            await LoginSession.updateMany(
                {
                    userId,

                    revoked: false,

                    expiresAt: {
                        $lte: new Date(),
                    },
                },
                {
                    $set: {
                        revoked: true,

                        revokedAt:
                            new Date(),
                    },
                }
            );

            /*
            |--------------------------------------------------------------------------
            | Get Active Sessions
            |--------------------------------------------------------------------------
            */

            const sessions =
                await LoginSession.find({
                    userId,

                    revoked: false,

                    expiresAt: {
                        $gt: new Date(),
                    },
                }).sort({
                    lastActivityAt:
                        -1,
                });

            const data =
                sessions.map(
                    (session) => ({
                        ...getSessionResponse(
                            session
                        ),

                        current:
                            currentSessionId
                                ? session._id.toString() ===
                                  currentSessionId.toString()
                                : false,
                    })
                );

            return res
                .status(200)
                .json({
                    data,

                    count:
                        data.length,
                });
        } catch (error) {
            console.error(
                "Get sessions error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while loading your sessions.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Revoke Individual Session
|--------------------------------------------------------------------------
*/

export const revokeSession =
    async (req, res) => {
        try {
            const userId =
                req.user.userId;

            const {
                id: sessionId,
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(
                    sessionId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid session.",
                    });
            }

            const session =
                await LoginSession.findOne({
                    _id: sessionId,

                    userId,

                    revoked: false,
                });

            if (!session) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Active session not found.",
                    });
            }

            session.revoked =
                true;

            session.revokedAt =
                new Date();

            await session.save();

            return res
                .status(200)
                .json({
                    message:
                        "Session revoked successfully.",
                });
        } catch (error) {
            console.error(
                "Revoke session error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while revoking the session.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Admin Login Activity
|--------------------------------------------------------------------------
*/

export const getLoginActivity =
    async (req, res) => {
        try {
            /*
            |--------------------------------------------------------------------------
            | Verify Administrator
            |--------------------------------------------------------------------------
            */

            const adminUser =
                await user.findById(
                    req.user.userId
                );

            if (!adminUser) {
                return res
                    .status(404)
                    .json({
                        message:
                            "User not found.",
                    });
            }

            if (
                adminUser.role !==
                "admin"
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "Admin access required.",
                    });
            }

            /*
            |--------------------------------------------------------------------------
            | Pagination
            |--------------------------------------------------------------------------
            */

            const page =
                Math.max(
                    Number(
                        req.query.page
                    ) || 1,
                    1
                );

            const limit =
                Math.min(
                    Math.max(
                        Number(
                            req.query.limit
                        ) || 20,
                        1
                    ),
                    100
                );

            const skip =
                (page - 1) *
                limit;

            /*
            |--------------------------------------------------------------------------
            | Get Login Sessions
            |--------------------------------------------------------------------------
            */

            const [
                sessions,
                total,
            ] =
                await Promise.all([
                    LoginSession.find({})
                        .populate(
                            "userId",
                            "name email"
                        )
                        .sort({
                            loginAt:
                                -1,
                        })
                        .skip(skip)
                        .limit(limit)
                        .lean(),

                    LoginSession.countDocuments(
                        {}
                    ),
                ]);

            /*
            |--------------------------------------------------------------------------
            | Format Response
            |--------------------------------------------------------------------------
            */

            const data =
                sessions.map(
                    (session) => ({
                        _id:
                            session._id,

                        user:
                            session.userId
                                ? {
                                      _id:
                                          session
                                              .userId
                                              ._id,

                                      name:
                                          session
                                              .userId
                                              .name,

                                      email:
                                          session
                                              .userId
                                              .email,
                                  }
                                : null,

                        browser:
                            session.browser,

                        operatingSystem:
                            session.operatingSystem,

                        deviceType:
                            session.deviceType,

                        ipAddress:
                            session.ipAddress,

                        location:
                            session.location,

                        loginAt:
                            session.loginAt,

                        lastActivityAt:
                            session.lastActivityAt,

                        trustedDevice:
                            session.trustedDevice,

                        revoked:
                            session.revoked,

                        revokedAt:
                            session.revokedAt,

                        expiresAt:
                            session.expiresAt,
                    })
                );

            return res
                .status(200)
                .json({
                    data,

                    pagination: {
                        page,

                        limit,

                        total,

                        totalPages:
                            Math.ceil(
                                total /
                                    limit
                            ),
                    },
                });
        } catch (error) {
            console.error(
                "Get login activity error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while loading login activity.",
                });
        }
    };