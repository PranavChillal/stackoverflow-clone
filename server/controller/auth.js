import user from "../models/auth.js";
import subscription from "../models/subscription.js";
import LoginSession from "../models/loginSession.js";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { randomInt } from "crypto";

import reputationHistory from "../models/reputationHistory.js";
import { updateReputation } from "../utils/reputation.js";
import { getReputationPrivileges } from "../utils/privileges.js";

import {
    sendLanguageOTPEmail,
    sendNewDeviceLoginEmail,
    sendLoginOTPEmail,
    sendPasswordResetEmail,
} from "../utils/email.js";

/*
|--------------------------------------------------------------------------
| Session Helpers
|--------------------------------------------------------------------------
*/

const createSessionToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const hashSessionToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

const hashOTP = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp.toString())
        .digest("hex");
};

/*
|--------------------------------------------------------------------------
| Device Detection
|--------------------------------------------------------------------------
*/

const getBrowser = (userAgent = "") => {
    if (/Edg\//i.test(userAgent)) {
        return "Microsoft Edge";
    }

    if (/OPR\//i.test(userAgent)) {
        return "Opera";
    }

    if (/Chrome\//i.test(userAgent)) {
        return "Google Chrome";
    }

    if (/Firefox\//i.test(userAgent)) {
        return "Mozilla Firefox";
    }

    if (/Safari\//i.test(userAgent)) {
        return "Safari";
    }

    return "Unknown";
};

const getOperatingSystem = (userAgent = "") => {
    if (/Windows/i.test(userAgent)) {
        return "Windows";
    }

    if (/Mac OS X/i.test(userAgent)) {
        return "macOS";
    }

    if (/Android/i.test(userAgent)) {
        return "Android";
    }

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return "iOS";
    }

    if (/Linux/i.test(userAgent)) {
        return "Linux";
    }

    return "Unknown";
};

const getDeviceType = (userAgent = "") => {
    if (/iPad|Tablet/i.test(userAgent)) {
        return "tablet";
    }

    if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) {
        return "mobile";
    }

    if (userAgent) {
        return "desktop";
    }

    return "unknown";
};

/*
|--------------------------------------------------------------------------
| JWT
|--------------------------------------------------------------------------
*/

const createToken = (userId, sessionId) => {
    return jwt.sign(
        {
            userId,
            sessionId,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

/*
|--------------------------------------------------------------------------
| Safe User
|--------------------------------------------------------------------------
*/

const safeUser = (user) => {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        about: user.about,
        tags: user.tags,
        joinDate: user.joinDate,
        reputation: user.reputation,
        preferredLanguage:
            user.preferredLanguage || "english",
    };
};

/*
|--------------------------------------------------------------------------
| Create Login Session
|--------------------------------------------------------------------------
*/

const createLoginSession = async (
    existingUser,
    req,
    pendingVerification = false
) => {
    const sessionToken = createSessionToken();

    const sessionTokenHash =
        hashSessionToken(sessionToken);

    const userAgent =
        req.headers["user-agent"] || "";

    const browser =
        getBrowser(userAgent);

    const operatingSystem =
        getOperatingSystem(userAgent);

    const deviceType =
        getDeviceType(userAgent);

    const ipAddress =
        req.headers["x-forwarded-for"]
            ?.split(",")[0]
            ?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";

    /*
    |--------------------------------------------------------------------------
    | Check Existing Device
    |--------------------------------------------------------------------------
    */

    const existingDevice =
        await LoginSession.findOne({
            userId: existingUser._id,
            browser,
            operatingSystem,
            deviceType,
            trustedDevice: true,
            revoked: false,
            pendingVerification: false,
            expiresAt: {
                $gt: new Date(),
            },
        });

    const isNewDevice = !existingDevice;

    /*
    |--------------------------------------------------------------------------
    | Session Expiration
    |--------------------------------------------------------------------------
    */

    const expiresAt = new Date(
        Date.now() +
            7 *
                24 *
                60 *
                60 *
                1000
    );

    /*
    |--------------------------------------------------------------------------
    | OTP
    |--------------------------------------------------------------------------
    */

    let otpHash = null;
    let otpExpiresAt = null;
    let otp = null;

    if (pendingVerification) {
        otp = randomInt(
            100000,
            1000000
        ).toString();

        otpHash = hashOTP(otp);

        otpExpiresAt = new Date(
            Date.now() +
                10 *
                    60 *
                    1000
        );

        return {
            session:
                await LoginSession.create({
                    userId:
                        existingUser._id,

                    sessionTokenHash,

                    browser,

                    operatingSystem,

                    deviceType,

                    ipAddress,

                    location: "",

                    loginAt:
                        new Date(),

                    lastActivityAt:
                        new Date(),

                    trustedDevice: false,

                    otpHash,

                    otpExpiresAt,

                    otpAttempts: 0,

                    otpVerified: false,

                    pendingVerification: true,

                    revoked: false,

                    revokedAt: null,

                    expiresAt,
                }),

            sessionToken,

            isNewDevice,

            otp,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Normal Session
    |--------------------------------------------------------------------------
    */

    const session =
        await LoginSession.create({
            userId:
                existingUser._id,

            sessionTokenHash,

            browser,

            operatingSystem,

            deviceType,

            ipAddress,

            location: "",

            loginAt:
                new Date(),

            lastActivityAt:
                new Date(),

            trustedDevice: false,

            otpHash: null,

            otpExpiresAt: null,

            otpAttempts: 0,

            otpVerified: true,

            pendingVerification: false,

            revoked: false,

            revokedAt: null,

            expiresAt,
        });

    return {
        session,
        sessionToken,
        isNewDevice,
    };
};

/*
|--------------------------------------------------------------------------
| Generate Password
|--------------------------------------------------------------------------
*/

const generateLettersOnlyPassword = (
    length = 12
) => {
    const letters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    let password = "";

    for (
        let i = 0;
        i < length;
        i++
    ) {
        password +=
            letters[
                randomInt(
                    letters.length
                )
            ];
    }

    return password;
};

/*
|--------------------------------------------------------------------------
| Same Day
|--------------------------------------------------------------------------
*/

const isSameDay = (
    date1,
    date2
) => {
    return (
        date1.getFullYear() ===
            date2.getFullYear() &&
        date1.getMonth() ===
            date2.getMonth() &&
        date1.getDate() ===
            date2.getDate()
    );
};

/*
|--------------------------------------------------------------------------
| Languages
|--------------------------------------------------------------------------
*/

const supportedLanguages = [
    "english",
    "spanish",
    "hindi",
    "portuguese",
    "chinese",
    "french",
];

const languageNames = {
    english: "English",
    spanish: "Spanish",
    hindi: "Hindi",
    portuguese: "Portuguese",
    chinese: "Chinese",
    french: "French",
};

const generateLanguageOTP = () => {
    return randomInt(
        100000,
        1000000
    ).toString();
};

/*
|--------------------------------------------------------------------------
| Signup
|--------------------------------------------------------------------------
*/

export const Signup = async (
    req,
    res
) => {
    const {
        name,
        email,
        password,
        phone,
    } = req.body;

    try {
        const existinguser =
            await user.findOne({
                email,
            });

        if (existinguser) {
            return res.status(400).json({
                message:
                    "User already exists",
            });
        }

        const hashpassword =
            await bcrypt.hash(
                password,
                12
            );

        const newuser =
            await user.create({
                name,
                email,
                phone: phone || "",
                password:
                    hashpassword,
            });

        await subscription.create({
            userId:
                newuser._id,

            plan: "free",

            status: "active",

            amount: 0,

            currency: "INR",

            startDate:
                new Date(),

            billingDetails: {
                name:
                    newuser.name,

                email:
                    newuser.email,
            },
        });

        const {
            session,
        } =
            await createLoginSession(
                newuser,
                req,
                false
            );

        const token =
            createToken(
                newuser._id,
                session._id
            );

        res.cookie(
            "token",
            token,
            {
                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite:
                    process.env.NODE_ENV ===
                    "production"
                        ? "none"
                        : "lax",

                maxAge:
                    7 *
                    24 *
                    60 *
                    60 *
                    1000,
            }
        );

        res.status(201).json({
            data:
                safeUser(newuser),
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const Login = async (
    req,
    res
) => {
    const {
        email,
        password,
    } = req.body;

    try {
        const existinguser =
            await user.findOne({
                email,
            });

        if (!existinguser) {
            return res.status(404).json({
                message:
                    "User does not exist",
            });
        }

        const ispasswordcrct =
            await bcrypt.compare(
                password,
                existinguser.password
            );

        if (!ispasswordcrct) {
            return res.status(400).json({
                message:
                    "Invalid password",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Detect Device
        |--------------------------------------------------------------------------
        */

        const userAgent =
            req.headers["user-agent"] || "";

        const browser =
            getBrowser(userAgent);

        const operatingSystem =
            getOperatingSystem(
                userAgent
            );

        const deviceType =
            getDeviceType(userAgent);

        /*
        |--------------------------------------------------------------------------
        | Check Known Device
        |--------------------------------------------------------------------------
        */

        const existingDevice =
            await LoginSession.findOne({
                userId:
                    existinguser._id,

                browser,

                operatingSystem,

                deviceType,

                revoked: false,

                pendingVerification:
                    false,

                expiresAt: {
                    $gt: new Date(),
                },
            });

        /*
        |--------------------------------------------------------------------------
        | Known Device
        |--------------------------------------------------------------------------
        */

        if (existingDevice) {
            const {
                session,
            } =
                await createLoginSession(
                    existinguser,
                    req,
                    false
                );

            const token =
                createToken(
                    existinguser._id,
                    session._id
                );

            res.cookie(
                "token",
                token,
                {
                    httpOnly: true,

                    secure:
                        process.env.NODE_ENV ===
                        "production",

                    sameSite:
                        process.env.NODE_ENV ===
                        "production"
                            ? "none"
                            : "lax",

                    maxAge:
                        7 *
                        24 *
                        60 *
                        60 *
                        1000,
                }
            );

            return res.status(200).json({
                data:
                    safeUser(
                        existinguser
                    ),
            });
        }

        /*
        |--------------------------------------------------------------------------
        | New Device
        |--------------------------------------------------------------------------
        */

        const {
            session,
            otp,
        } =
            await createLoginSession(
                existinguser,
                req,
                true
            );

        /*
        |--------------------------------------------------------------------------
        | Send OTP Email Without Blocking Login Response
        |--------------------------------------------------------------------------
        |
        | The OTP and pending session have already been safely stored in
        | MongoDB by createLoginSession(). Send the email in the background
        | so Gmail latency does not block the login HTTP response.
        |--------------------------------------------------------------------------
        */

        void sendLoginOTPEmail({
            to:
                existinguser.email,

            name:
                existinguser.name,

            otp,

            browser:
                session.browser,

            operatingSystem:
                session.operatingSystem,

            deviceType:
                session.deviceType,

            ipAddress:
                session.ipAddress,
        }).catch((emailError) => {
            console.error(
                "Login OTP email error:",
                emailError
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Return Pending Login Immediately
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            message:
                "Verification OTP sent to your registered email address.",

            requiresOtp: true,

            sessionId:
                session._id,

            /*
            |--------------------------------------------------------------------------
            | Development OTP
            |--------------------------------------------------------------------------
            |
            | This is intentionally returned only
            | outside production.
            |--------------------------------------------------------------------------
            */

            ...(process.env.NODE_ENV !==
            "production"
                ? {
                      developmentOtp:
                          otp,
                  }
                : {}),
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Verify Login OTP
|--------------------------------------------------------------------------
*/

export const verifyLoginOTP =
    async (req, res) => {
        const {
            sessionId,
            otp,
            rememberDevice,
        } = req.body;

        try {
            if (
                !sessionId ||
                !otp
            ) {
                return res.status(400).json({
                    message:
                        "Session ID and OTP are required.",
                });
            }

            if (
                !mongoose.Types.ObjectId.isValid(
                    sessionId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid session.",
                });
            }

            const session =
                await LoginSession.findOne({
                    _id: sessionId,

                    pendingVerification:
                        true,

                    revoked: false,
                });

            if (!session) {
                return res.status(404).json({
                    message:
                        "Login verification session not found or has already been completed.",
                });
            }

            /*
            |--------------------------------------------------------------------------
            | Check Expiration
            |--------------------------------------------------------------------------
            */

            if (
                !session.otpExpiresAt ||
                new Date() >
                    new Date(
                        session.otpExpiresAt
                    )
            ) {
                session.revoked =
                    true;

                session.revokedAt =
                    new Date();

                session.pendingVerification =
                    false;

                await session.save();

                return res.status(400).json({
                    message:
                        "This OTP has expired. Please log in again.",
                });
            }

            /*
            |--------------------------------------------------------------------------
            | Limit Attempts
            |--------------------------------------------------------------------------
            */

            if (
                session.otpAttempts >=
                5
            ) {
                session.revoked =
                    true;

                session.revokedAt =
                    new Date();

                session.pendingVerification =
                    false;

                await session.save();

                return res.status(429).json({
                    message:
                        "Too many incorrect attempts. Please log in again.",
                });
            }

            const providedOtp =
                otp
                    .toString()
                    .trim();

            const providedOtpHash =
                hashOTP(
                    providedOtp
                );

            /*
            |--------------------------------------------------------------------------
            | Verify OTP
            |--------------------------------------------------------------------------
            */

            if (
                providedOtpHash !==
                session.otpHash
            ) {
                session.otpAttempts +=
                    1;

                await session.save();

                return res.status(400).json({
                    message:
                        "Invalid verification OTP.",
                });
            }

            /*
            |--------------------------------------------------------------------------
            | Activate Session
            |--------------------------------------------------------------------------
            */

            session.otpVerified =
                true;

            session.pendingVerification =
                false;

            session.trustedDevice =
                rememberDevice === true;

            session.otpHash = null;

            session.otpExpiresAt =
                null;

            session.otpAttempts = 0;

            session.lastActivityAt =
                new Date();

            await session.save();

            /*
            |--------------------------------------------------------------------------
            | Create JWT
            |--------------------------------------------------------------------------
            */

            const token =
                createToken(
                    session.userId,
                    session._id
                );

            res.cookie(
                "token",
                token,
                {
                    httpOnly: true,

                    secure:
                        process.env.NODE_ENV ===
                        "production",

                    sameSite:
                        process.env.NODE_ENV ===
                        "production"
                            ? "none"
                            : "lax",

                    maxAge:
                        7 *
                        24 *
                        60 *
                        60 *
                        1000,
                }
            );

            const existinguser =
                await user.findById(
                    session.userId
                );

            if (!existinguser) {
                return res.status(404).json({
                    message:
                        "User account not found.",
                });
            }

            return res.status(200).json({
                message:
                    "Login verified successfully.",

                data:
                    safeUser(
                        existinguser
                    ),
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message:
                    "Something went wrong while verifying the login.",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Resend Login OTP
|--------------------------------------------------------------------------
*/

export const resendLoginOTP =
    async (req, res) => {
        const {
            sessionId,
        } = req.body;

        try {
            if (!sessionId) {
                return res.status(400).json({
                    message:
                        "Session ID is required.",
                });
            }

            if (
                !mongoose.Types.ObjectId.isValid(
                    sessionId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid session.",
                });
            }

            const session =
                await LoginSession.findOne({
                    _id: sessionId,

                    pendingVerification:
                        true,

                    revoked: false,
                });

            if (!session) {
                return res.status(404).json({
                    message:
                        "Login verification session not found.",
                });
            }

            /*
            |--------------------------------------------------------------------------
            | Generate New OTP
            |--------------------------------------------------------------------------
            */

            const otp =
                randomInt(
                    100000,
                    1000000
                ).toString();

            session.otpHash =
                hashOTP(otp);

            session.otpExpiresAt =
                new Date(
                    Date.now() +
                        10 *
                            60 *
                            1000
                );

            session.otpAttempts =
                0;

            await session.save();

            const existinguser =
                await user.findById(
                    session.userId
                );

            if (!existinguser) {
                return res.status(404).json({
                    message:
                        "User account not found.",
                });
            }

            /*
            |--------------------------------------------------------------------------
            | Send New OTP
            |--------------------------------------------------------------------------
            */

            let emailSent = true;

            try {
                await sendLoginOTPEmail({
                    to:
                        existinguser.email,

                    name:
                        existinguser.name,

                    otp,

                    browser:
                        session.browser,

                    operatingSystem:
                        session.operatingSystem,

                    deviceType:
                        session.deviceType,

                    ipAddress:
                        session.ipAddress,
                });
            } catch (emailError) {
                console.error(
                    "Resend login OTP email error:",
                    emailError
                );

                emailSent = false;

                /*
                |--------------------------------------------------------------------------
                | Production
                |--------------------------------------------------------------------------
                */

                if (
                    process.env.NODE_ENV ===
                    "production"
                ) {
                    return res.status(500).json({
                        message:
                            "Unable to resend the verification OTP.",
                    });
                }
            }

            return res.status(200).json({
                message: emailSent
                    ? "A new verification OTP has been sent."
                    : "Development mode: a new verification OTP has been generated.",

                ...(process.env.NODE_ENV !==
                "production"
                    ? {
                          developmentOtp:
                              otp,
                      }
                    : {}),
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message:
                    "Something went wrong while resending the OTP.",
            });
        }
    };
    /*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
*/

export const ForgotPassword =
    async (req, res) => {
        const {
            email,
            phone,
        } = req.body;

        try {
            if (!email && !phone) {
                return res.status(400).json({
                    message:
                        "Please enter your email address or phone number.",
                });
            }

            const identifier =
                email
                    ? {
                          email: email
                              .trim()
                              .toLowerCase(),
                      }
                    : {
                          phone:
                              phone.trim(),
                      };

            const existinguser =
                await user.findOne(
                    identifier
                );

            if (!existinguser) {
                return res.status(404).json({
                    message:
                        "No account was found with those details.",
                });
            }

            const now =
                new Date();

            if (
                existinguser.forgotPasswordLastRequestedAt &&
                isSameDay(
                    new Date(
                        existinguser.forgotPasswordLastRequestedAt
                    ),
                    now
                )
            ) {
                return res.status(429).json({
                    message:
                        "You can use this option only one time per day.",
                });
            }

            const generatedPassword =
                generateLettersOnlyPassword(
                    12
                );

            const hashedPassword =
                await bcrypt.hash(
                    generatedPassword,
                    12
                );

            existinguser.password =
                hashedPassword;

            existinguser.forgotPasswordLastRequestedAt =
                now;

            await existinguser.save();

            try {
                await sendPasswordResetEmail({
                    to:
                        existinguser.email,

                    name:
                        existinguser.name,

                    password:
                        generatedPassword,
                });
            } catch (emailError) {
                console.error(
                    "Password reset email error:",
                    emailError
                );

                if (
                    process.env.NODE_ENV ===
                    "production"
                ) {
                    return res.status(500).json({
                        message:
                            "Password was reset, but we could not send the reset email. Please contact support.",
                    });
                }
            }

            return res.status(200).json({
                message:
                    "Password reset successful. Please check your registered email for your new password.",
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong...",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Get All Users
|--------------------------------------------------------------------------
*/

export const getallusers =
    async (req, res) => {
        try {
            const alluser =
                await user
                    .find()
                    .select(
                        "-password"
                    )
                    .lean();

            const userIds =
                alluser.map(
                    (item) =>
                        item._id
                );

            const subscriptions =
                await subscription
                    .find({
                        userId: {
                            $in: userIds,
                        },

                        status: "active",
                    })
                    .select(
                        "userId plan status"
                    )
                    .lean();

            const subscriptionMap =
                new Map(
                    subscriptions.map(
                        (item) => [
                            String(
                                item.userId
                            ),
                            item,
                        ]
                    )
                );

            const usersWithSubscription =
                alluser.map(
                    (item) => {
                        const userSubscription =
                            subscriptionMap.get(
                                String(
                                    item._id
                                )
                            );

                        return {
                            ...item,

                            subscription:
                                userSubscription
                                    ? {
                                          plan:
                                              userSubscription.plan,

                                          status:
                                              userSubscription.status,
                                      }
                                    : {
                                          plan:
                                              "free",

                                          status:
                                              "active",
                                      },
                        };
                    }
                );

            res.status(200).json({
                data:
                    usersWithSubscription,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong...",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Update Profile
|--------------------------------------------------------------------------
*/

export const updateprofile =
    async (req, res) => {
        const {
            id: _id,
        } = req.params;

        const {
            name,
            phone,
            about,
            tags,
        } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(
                _id
            )
        ) {
            return res.status(400).json({
                message:
                    "User unavailable",
            });
        }

        try {
            const existinguser =
                await user.findById(
                    _id
                );

            if (!existinguser) {
                return res.status(404).json({
                    message:
                        "User not found",
                });
            }

            if (
                existinguser._id.toString() !==
                req.user.userId
            ) {
                return res.status(403).json({
                    message:
                        "You can only update your own profile",
                });
            }

            existinguser.name =
                name;

            existinguser.phone =
                phone || "";

            existinguser.about =
                about;

            existinguser.tags =
                tags || [];

            const profileCompleted =
                Boolean(
                    existinguser.name?.trim()
                ) &&
                Boolean(
                    existinguser.about?.trim()
                ) &&
                Array.isArray(
                    existinguser.tags
                ) &&
                existinguser.tags.length >
                    0;

            if (
                profileCompleted &&
                !existinguser.profileRewarded
            ) {
                await updateReputation(
                    existinguser._id,
                    10,
                    "Profile completed"
                );

                existinguser.profileRewarded =
                    true;
            }

            await existinguser.save();

            res.status(200).json({
                data:
                    safeUser(
                        existinguser
                    ),
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong...",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| My Reputation History
|--------------------------------------------------------------------------
*/

export const getMyReputationHistory =
    async (req, res) => {
        const userId =
            req.user.userId;

        try {
            const history =
                await reputationHistory
                    .find({
                        userId,
                    })
                    .sort({
                        createdAt:
                            -1,
                    });

            res.status(200).json({
                data: history,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong...",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| User Reputation History
|--------------------------------------------------------------------------
*/

export const getUserReputationHistory =
    async (req, res) => {
        const { id } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                message:
                    "User unavailable",
            });
        }

        try {
            const foundUser =
                await user
                    .findById(id)
                    .select(
                        "name reputation"
                    );

            if (!foundUser) {
                return res.status(404).json({
                    message:
                        "User not found",
                });
            }

            const history =
                await reputationHistory
                    .find({
                        userId: id,
                    })
                    .sort({
                        createdAt:
                            -1,
                    });

            res.status(200).json({
                data: {
                    user:
                        foundUser,
                    history,
                },
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong...",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| My Privileges
|--------------------------------------------------------------------------
*/

export const getMyPrivileges =
    async (req, res) => {
        const userId =
            req.user.userId;

        try {
            const foundUser =
                await user
                    .findById(userId)
                    .select(
                        "name reputation"
                    );

            if (!foundUser) {
                return res.status(404).json({
                    message:
                        "User not found",
                });
            }

            const privileges =
                getReputationPrivileges(
                    foundUser.reputation
                );

            res.status(200).json({
                data: {
                    reputation:
                        foundUser.reputation,

                    privileges,
                },
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong...",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Language Verification
|--------------------------------------------------------------------------
*/

export const requestLanguageChange =
    async (req, res) => {
        const userId =
            req.user.userId;

        const {
            language,
        } = req.body;

        try {
            if (
                !supportedLanguages.includes(
                    language
                )
            ) {
                return res.status(400).json({
                    message:
                        "Unsupported language.",
                });
            }

            const existinguser =
                await user.findById(
                    userId
                );

            if (!existinguser) {
                return res.status(404).json({
                    message:
                        "User not found.",
                });
            }

            if (
                existinguser.preferredLanguage ===
                language
            ) {
                return res.status(200).json({
                    message:
                        "This language is already selected.",

                    language,
                });
            }

            const otp =
                generateLanguageOTP();

            const otpExpiresAt =
                new Date(
                    Date.now() +
                        10 *
                            60 *
                            1000
                );

            existinguser.languageOtp =
                hashOTP(otp);

            existinguser.languageOtpExpiresAt =
                otpExpiresAt;

            existinguser.languageOtpTarget =
                language;

            existinguser.languageOtpVerified =
                false;

            if (
                language !==
                    "french" &&
                !existinguser.phone?.trim()
            ) {
                return res.status(400).json({
                    message:
                        "Please add a registered mobile number before changing to this language.",
                });
            }

            await existinguser.save();

if (
    language ===
    "french"
) {
    /*
    |--------------------------------------------------------------------------
    | Send French OTP Email Without Blocking Response
    |--------------------------------------------------------------------------
    |
    | The OTP has already been hashed and stored in MongoDB.
    | Send the email in the background so Gmail/Nodemailer latency
    | does not delay the verification popup.
    |--------------------------------------------------------------------------
    */

    void sendLanguageOTPEmail({
        to:
            existinguser.email,

        name:
            existinguser.name,

        otp,

        language:
            languageNames[
                language
            ],
    }).catch((emailError) => {
        console.error(
            "Language OTP email error:",
            emailError
        );
    });

    return res.status(200).json({
        message:
            "A verification OTP has been sent to your registered email address to change your language to " +
            languageNames[
                language
            ] +
            ".",

        verificationMethod:
            "email",

        language,

        ...(process.env.NODE_ENV !==
        "production"
            ? {
                  developmentOtp:
                      otp,
              }
            : {}),
    });
}

            return res.status(200).json({
                message:
                    `A mobile OTP has been generated for your registered mobile number to change your language to ${languageNames[language]}.`,

                verificationMethod:
                    "mobile",

                language,

                ...(process.env.NODE_ENV !==
                "production"
                    ? {
                          developmentOtp:
                              otp,
                      }
                    : {}),
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong while requesting language verification.",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Verify Language OTP
|--------------------------------------------------------------------------
*/

export const verifyLanguageOTP =
    async (req, res) => {
        const userId =
            req.user.userId;

        const { otp } =
            req.body;

        try {
            if (!otp) {
                return res.status(400).json({
                    message:
                        "Please enter the verification OTP.",
                });
            }

            const existinguser =
                await user.findById(
                    userId
                );

            if (!existinguser) {
                return res.status(404).json({
                    message:
                        "User not found.",
                });
            }

            if (
                !existinguser.languageOtp ||
                !existinguser.languageOtpExpiresAt ||
                !existinguser.languageOtpTarget
            ) {
                return res.status(400).json({
                    message:
                        "No language verification request was found.",
                });
            }

            if (
                new Date() >
                new Date(
                    existinguser.languageOtpExpiresAt
                )
            ) {
                existinguser.languageOtp =
                    null;

                existinguser.languageOtpExpiresAt =
                    null;

                existinguser.languageOtpTarget =
                    null;

                existinguser.languageOtpVerified =
                    false;

                await existinguser.save();

                return res.status(400).json({
                    message:
                        "This OTP has expired. Please request a new one.",
                });
            }

            const providedOtp =
                otp
                    .toString()
                    .trim();

            const providedOtpHash =
                hashOTP(providedOtp);

            if (
                providedOtpHash !==
                existinguser.languageOtp
            ) {
                return res.status(400).json({
                    message:
                        "Invalid verification OTP.",
                });
            }

            const targetLanguage =
                existinguser.languageOtpTarget;

            existinguser.preferredLanguage =
                targetLanguage;

            existinguser.languageOtp =
                null;

            existinguser.languageOtpExpiresAt =
                null;

            existinguser.languageOtpTarget =
                null;

            existinguser.languageOtpVerified =
                true;

            await existinguser.save();

            res.status(200).json({
                message:
                    `Language changed to ${languageNames[targetLanguage]}.`,

                language:
                    targetLanguage,

                data:
                    safeUser(
                        existinguser
                    ),
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong while verifying the language OTP.",
            });
        }
    };