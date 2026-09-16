import express from "express";

import {
    getallusers,
    Login,
    Signup,
    updateprofile,
    getMyReputationHistory,
    getUserReputationHistory,
    getMyPrivileges,
    ForgotPassword,
    requestLanguageChange,
    verifyLanguageOTP,
    verifyLoginOTP,
    resendLoginOTP,
} from "../controller/auth.js";

import {
    getMySessions,
    revokeSession,
    getLoginActivity,
} from "../controller/session.js";

import { authenticate } from "../middleware/auth.js";

const router =
    express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.post(
    "/signup",
    Signup
);

router.post(
    "/login",
    Login
);

/*
|--------------------------------------------------------------------------
| Login OTP Verification
|--------------------------------------------------------------------------
*/

router.post(
    "/login/verify-otp",
    verifyLoginOTP
);

router.post(
    "/login/resend-otp",
    resendLoginOTP
);

router.post(
    "/forgot-password",
    ForgotPassword
);

/*
|--------------------------------------------------------------------------
| Users
|--------------------------------------------------------------------------
*/

router.get(
    "/getalluser",
    getallusers
);

router.patch(
    "/update/:id",
    authenticate,
    updateprofile
);

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    authenticate,
    (req, res) => {
        res.status(200).json({
            message:
                "Authentication working",

            userId:
                req.user.userId,
        });
    }
);

/*
|--------------------------------------------------------------------------
| Login Sessions
|--------------------------------------------------------------------------
*/

router.get(
    "/sessions",
    authenticate,
    getMySessions
);

router.delete(
    "/sessions/:id",
    authenticate,
    revokeSession
);
router.get(
    "/admin/login-activity",
    authenticate,
    getLoginActivity
);

/*
|--------------------------------------------------------------------------
| Reputation
|--------------------------------------------------------------------------
*/

router.get(
    "/reputation-history",
    authenticate,
    getMyReputationHistory
);

router.get(
    "/reputation-history/:id",
    getUserReputationHistory
);

router.get(
    "/privileges",
    authenticate,
    getMyPrivileges
);

/*
|--------------------------------------------------------------------------
| Language Verification
|--------------------------------------------------------------------------
*/

router.post(
    "/language/request",
    authenticate,
    requestLanguageChange
);

router.post(
    "/language/verify",
    authenticate,
    verifyLanguageOTP
);

export default router;