import express from "express";

import {
    createSubscriptionOrder,
    verifySubscriptionPayment,
    getSubscriptionStatus,
    getPaymentHistory,
    downloadInvoice,
} from "../controller/subscription.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create Razorpay Subscription Order
|--------------------------------------------------------------------------
*/

router.post(
    "/create-order",
    authenticate,
    createSubscriptionOrder
);

/*
|--------------------------------------------------------------------------
| Verify Razorpay Subscription Payment
|--------------------------------------------------------------------------
*/

router.post(
    "/verify-payment",
    authenticate,
    verifySubscriptionPayment
);

/*
|--------------------------------------------------------------------------
| Get Current Subscription Status
|--------------------------------------------------------------------------
*/

router.get(
    "/status",
    authenticate,
    getSubscriptionStatus
);

/*
|--------------------------------------------------------------------------
| Get Payment History
|--------------------------------------------------------------------------
*/

router.get(
    "/payments",
    authenticate,
    getPaymentHistory
);

/*
|--------------------------------------------------------------------------
| Download Paid Invoice
|--------------------------------------------------------------------------
*/

router.get(
    "/invoice/:paymentId",
    authenticate,
    downloadInvoice
);

export default router;