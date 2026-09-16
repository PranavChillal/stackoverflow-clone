import crypto from "crypto";
import PDFDocument from "pdfkit";

import razorpay from "../utils/razorpay.js";
import subscription from "../models/subscription.js";
import payment from "../models/payment.js";
import user from "../models/auth.js";

import {
    SUBSCRIPTION_PLANS,
    getOrCreateSubscription,
} from "../utils/subscription.js";

import {
    sendSubscriptionConfirmationEmail,
} from "../utils/email.js";

const PAID_PLANS = [
    "bronze",
    "silver",
    "gold",
];

const generateInvoiceNumber = () => {
    return `INV-${Date.now()}-${crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase()}`;
};

const generateInvoiceBuffer = (
    existingPayment
) => {
    return new Promise(
        (resolve, reject) => {
            try {
                const invoice =
                    new PDFDocument({
                        size: "A4",
                        margin: 50,
                    });

                const chunks = [];

                invoice.on(
                    "data",
                    (chunk) => {
                        chunks.push(chunk);
                    }
                );

                invoice.on(
                    "end",
                    () => {
                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        );
                    }
                );

                invoice.on(
                    "error",
                    (error) => {
                        reject(error);
                    }
                );

                invoice
                    .fontSize(24)
                    .font("Helvetica-Bold")
                    .text("INVOICE", {
                        align: "center",
                    });

                invoice.moveDown();

                invoice
                    .fontSize(12)
                    .font("Helvetica")
                    .text(
                        `Invoice Number: ${existingPayment.invoiceNumber}`
                    );

                invoice.text(
                    `Invoice Date: ${new Date(
                        existingPayment.paidAt ||
                            existingPayment.createdAt
                    ).toLocaleDateString(
                        "en-IN"
                    )}`
                );

                invoice.moveDown();

                invoice
                    .fontSize(16)
                    .font("Helvetica-Bold")
                    .text(
                        "Billing Details"
                    );

                invoice.moveDown(0.5);

                invoice
                    .fontSize(12)
                    .font("Helvetica")
                    .text(
                        `Name: ${
                            existingPayment
                                .billingDetails
                                ?.name ||
                            "Not provided"
                        }`
                    );

                invoice.text(
                    `Email: ${
                        existingPayment
                            .billingDetails
                            ?.email ||
                        "Not provided"
                    }`
                );

                invoice.text(
                    `Phone: ${
                        existingPayment
                            .billingDetails
                            ?.phone ||
                        "Not provided"
                    }`
                );

                invoice.text(
                    `Address: ${
                        existingPayment
                            .billingDetails
                            ?.address ||
                        "Not provided"
                    }`
                );

                invoice.text(
                    `City: ${
                        existingPayment
                            .billingDetails
                            ?.city ||
                        "Not provided"
                    }`
                );

                invoice.text(
                    `State: ${
                        existingPayment
                            .billingDetails
                            ?.state ||
                        "Not provided"
                    }`
                );

                invoice.text(
                    `Postal Code: ${
                        existingPayment
                            .billingDetails
                            ?.postalCode ||
                        "Not provided"
                    }`
                );

                invoice.text(
                    `Country: ${
                        existingPayment
                            .billingDetails
                            ?.country ||
                        "India"
                    }`
                );

                invoice.moveDown();

                invoice
                    .fontSize(16)
                    .font("Helvetica-Bold")
                    .text(
                        "Payment Details"
                    );

                invoice.moveDown(0.5);

                const formattedPlan =
                    existingPayment.plan
                        .charAt(0)
                        .toUpperCase() +
                    existingPayment.plan.slice(
                        1
                    );

                invoice
                    .fontSize(12)
                    .font("Helvetica")
                    .text(
                        `Plan: ${formattedPlan}`
                    );

                invoice.text(
                    `Amount: ₹${existingPayment.amount}`
                );

                invoice.text(
                    `Currency: ${existingPayment.currency}`
                );

                invoice.text(
                    `Status: ${
                        existingPayment.status
                            .charAt(0)
                            .toUpperCase() +
                        existingPayment.status.slice(
                            1
                        )
                    }`
                );

                invoice.text(
                    `Payment ID: ${
                        existingPayment.razorpayPaymentId ||
                        "N/A"
                    }`
                );

                invoice.moveDown();

                invoice
                    .fontSize(10)
                    .font("Helvetica")
                    .text(
                        "Thank you for your subscription.",
                        {
                            align: "center",
                        }
                    );

                invoice.end();
            } catch (error) {
                reject(error);
            }
        }
    );
};

/*
|--------------------------------------------------------------------------
| Create Subscription Order
|--------------------------------------------------------------------------
*/

export const createSubscriptionOrder =
    async (req, res) => {
        const userId =
            req.user.userId;

        const { plan } = req.body;

        if (
            !PAID_PLANS.includes(plan)
        ) {
            return res.status(400).json({
                message:
                    "Invalid subscription plan. Choose Bronze, Silver, or Gold.",
            });
        }

        try {
            const currentUser =
                await user
                    .findById(userId)
                    .select(
                        "name email"
                    );

            if (!currentUser) {
                return res.status(404).json({
                    message:
                        "User not found",
                });
            }

            const currentSubscription =
                await getOrCreateSubscription(
                    userId,
                    currentUser
                );

            if (
                currentSubscription.plan ===
                    plan &&
                currentSubscription.status ===
                    "active"
            ) {
                return res.status(400).json({
                    message:
                        "You are already subscribed to this plan.",
                });
            }

            const planDetails =
                SUBSCRIPTION_PLANS[
                    plan
                ];

            const options = {
                amount:
                    planDetails.price *
                    100,

                currency: "INR",

                receipt: `sub_${userId}_${Date.now()}`,

                notes: {
                    userId:
                        userId.toString(),

                    plan,
                },
            };

            const order =
                await razorpay.orders.create(
                    options
                );

            const invoiceNumber =
                generateInvoiceNumber();

            await payment.create({
                userId,

                subscriptionId:
                    currentSubscription._id,

                plan,

                amount:
                    planDetails.price,

                currency: "INR",

                status: "pending",

                razorpayOrderId:
                    order.id,

                invoiceNumber,

                billingDetails: {
                    name:
                        currentUser.name ||
                        "",

                    email:
                        currentUser.email ||
                        "",
                },
            });

            /*
            IMPORTANT:
            Do NOT change the existing
            subscription to "pending".

            A pending payment should remain
            pending independently.

            The existing active subscription
            stays active until Razorpay payment
            verification succeeds.
            */

            return res.status(200).json({
                data: {
                    orderId:
                        order.id,

                    amount:
                        order.amount,

                    currency:
                        order.currency,

                    plan,

                    planName:
                        planDetails.name,

                    keyId:
                        process.env
                            .RAZORPAY_KEY_ID,
                },
            });
        } catch (error) {
            console.log(
                "Create Razorpay order error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to create payment order.",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Verify Subscription Payment
|--------------------------------------------------------------------------
*/

export const verifySubscriptionPayment =
    async (req, res) => {
        const userId =
            req.user.userId;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message:
                    "Payment verification details are required.",
            });
        }

        try {
            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env
                            .RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${razorpay_order_id}|${razorpay_payment_id}`
                    )
                    .digest("hex");

            if (
                generatedSignature !==
                razorpay_signature
            ) {
                return res.status(400).json({
                    message:
                        "Payment verification failed.",
                });
            }

            const existingPayment =
                await payment.findOne({
                    razorpayOrderId:
                        razorpay_order_id,

                    userId,
                });

            if (!existingPayment) {
                return res.status(404).json({
                    message:
                        "Payment record not found.",
                });
            }

            if (
                existingPayment.status ===
                "paid"
            ) {
                return res.status(200).json({
                    message:
                        "Payment already verified.",
                });
            }

            const currentUser =
                await user.findById(
                    userId
                );

            if (!currentUser) {
                return res.status(404).json({
                    message:
                        "User not found.",
                });
            }

            const currentSubscription =
                await subscription.findById(
                    existingPayment.subscriptionId
                );

            if (!currentSubscription) {
                return res.status(404).json({
                    message:
                        "Subscription not found.",
                });
            }

            const now =
                new Date();

            const renewalDate =
                new Date(now);

            renewalDate.setDate(
                renewalDate.getDate() +
                    30
            );

            /*
            Activate the subscription ONLY
            after successful Razorpay verification.
            */

            currentSubscription.plan =
                existingPayment.plan;

            currentSubscription.status =
                "active";

            currentSubscription.amount =
                existingPayment.amount;

            currentSubscription.currency =
                existingPayment.currency;

            currentSubscription.startDate =
                now;

            currentSubscription.renewalDate =
                renewalDate;

            currentSubscription.currentPaymentId =
                razorpay_payment_id;

            currentSubscription.billingDetails =
                {
                    name:
                        currentUser.name ||
                        "",

                    email:
                        currentUser.email ||
                        "",
                };

            await currentSubscription.save();

            existingPayment.status =
                "paid";

            existingPayment.razorpayPaymentId =
                razorpay_payment_id;

            existingPayment.razorpaySignature =
                razorpay_signature;

            existingPayment.paidAt =
                now;

            await existingPayment.save();

            try {
                const invoiceBuffer =
                    await generateInvoiceBuffer(
                        existingPayment
                    );

                const formattedPlan =
                    existingPayment.plan
                        .charAt(0)
                        .toUpperCase() +
                    existingPayment.plan.slice(
                        1
                    );

                await sendSubscriptionConfirmationEmail(
                    {
                        to:
                            currentUser.email,

                        name:
                            currentUser.name ||
                            "User",

                        plan:
                            formattedPlan,

                        amount:
                            existingPayment.amount,

                        currency:
                            existingPayment.currency,

                        invoiceNumber:
                            existingPayment.invoiceNumber,

                        paymentId:
                            existingPayment.razorpayPaymentId,

                        renewalDate:
                            currentSubscription.renewalDate,

                        invoiceBuffer,
                    }
                );

                console.log(
                    "Subscription confirmation email sent successfully."
                );
            } catch (emailError) {
                console.log(
                    "Subscription confirmation email error:",
                    emailError
                );
            }

            return res.status(200).json({
                message:
                    "Payment verified and subscription activated successfully.",

                data: {
                    plan:
                        currentSubscription.plan,

                    status:
                        currentSubscription.status,

                    renewalDate:
                        currentSubscription.renewalDate,

                    invoiceNumber:
                        existingPayment.invoiceNumber,
                },
            });
        } catch (error) {
            console.log(
                "Payment verification error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to verify payment.",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Get Subscription Status
|--------------------------------------------------------------------------
*/

export const getSubscriptionStatus =
    async (req, res) => {
        const userId =
            req.user.userId;

        try {
            const currentSubscription =
    await subscription
        .findOne({
            userId,
        })
        .sort({
            updatedAt: -1,
            createdAt: -1,
        });

            if (!currentSubscription) {
                return res.status(200).json({
                    data: {
                        plan: "free",
                        status: "active",
                        amount: 0,
                        currency: "INR",
                        renewalDate: null,
                    },
                });
            }

            /*
            If the subscription is pending,
            check whether it is actually linked
            to a completed payment.

            This prevents the UI from showing
            stale pending state after a successful
            payment.
            */

            let status =
                currentSubscription.status;

            if (
                currentSubscription.status ===
                "pending"
            ) {
                const latestPaidPayment =
                    await payment
                        .findOne({
                            userId,

                            subscriptionId:
                                currentSubscription._id,

                            status: "paid",
                        })
                        .sort({
                            paidAt: -1,
                        });

                if (
                    latestPaidPayment
                ) {
                    status = "active";

                    currentSubscription.status =
                        "active";

                    currentSubscription.plan =
                        latestPaidPayment.plan;

                    currentSubscription.amount =
                        latestPaidPayment.amount;

                    currentSubscription.currency =
                        latestPaidPayment.currency;

                    currentSubscription.currentPaymentId =
                        latestPaidPayment.razorpayPaymentId;

                    if (
                        !currentSubscription.renewalDate
                    ) {
                        const renewalDate =
                            new Date(
                                latestPaidPayment.paidAt ||
                                    latestPaidPayment.createdAt
                            );

                        renewalDate.setDate(
                            renewalDate.getDate() +
                                30
                        );

                        currentSubscription.renewalDate =
                            renewalDate;
                    }

                    await currentSubscription.save();
                }
            }

            return res.status(200).json({
                data: {
                    plan:
                        currentSubscription.plan,

                    status,

                    amount:
                        currentSubscription.amount,

                    currency:
                        currentSubscription.currency,

                    startDate:
                        currentSubscription.startDate,

                    renewalDate:
                        currentSubscription.renewalDate,

                    currentPaymentId:
                        currentSubscription.currentPaymentId,
                },
            });
        } catch (error) {
            console.log(
                "Get subscription status error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to get subscription status.",
            });
        }
    };

/*
|--------------------------------------------------------------------------
| Payment History
|--------------------------------------------------------------------------
*/

export const getPaymentHistory =
    async (req, res) => {
        const userId =
            req.user.userId;

        try {
            const payments =
                await payment
                    .find({
                        userId,
                        status: "paid",
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .select(
                        "plan amount currency status invoiceNumber razorpayPaymentId paidAt createdAt billingDetails"
                    );

            return res.status(200).json({
                data: payments,
            });
        } catch (error) {
            console.log(
                "Get payment history error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to get payment history.",
            });
        }
    };
/*Q
|--------------------------------------------------------------------------
| Download Invoice
|--------------------------------------------------------------------------
*/

export const downloadInvoice =
    async (req, res) => {
        const userId =
            req.user.userId;

        const { paymentId } =
            req.params;

        try {
            const existingPayment =
                await payment.findOne({
                    _id: paymentId,

                    userId,

                    status: "paid",
                });

            if (!existingPayment) {
                return res.status(404).json({
                    message:
                        "Paid payment record not found.",
                });
            }

            const invoiceBuffer =
                await generateInvoiceBuffer(
                    existingPayment
                );

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${existingPayment.invoiceNumber}.pdf"`
            );

            return res.send(
                invoiceBuffer
            );
        } catch (error) {
            console.log(
                "Download invoice error:",
                error
            );

            if (!res.headersSent) {
                return res.status(500).json({
                    message:
                        "Unable to generate invoice.",
                });
            }
        }
    };

/*
|--------------------------------------------------------------------------
| Temporary Development Email Test
|--------------------------------------------------------------------------
*/

export const sendTestSubscriptionEmail =
    async (req, res) => {
        const userId =
            req.user.userId;

        try {
            const existingPayment =
                await payment
                    .findOne({
                        userId,

                        status: "paid",
                    })
                    .sort({
                        paidAt: -1,
                    });

            if (!existingPayment) {
                return res.status(404).json({
                    message:
                        "No paid payment found for this user.",
                });
            }

            const currentUser =
                await user.findById(
                    userId
                );

            if (!currentUser) {
                return res.status(404).json({
                    message:
                        "User not found.",
                });
            }

            const currentSubscription =
                await subscription.findById(
                    existingPayment.subscriptionId
                );

            if (!currentSubscription) {
                return res.status(404).json({
                    message:
                        "Subscription not found.",
                });
            }

            if (!currentUser.email) {
                return res.status(400).json({
                    message:
                        "User does not have an email address.",
                });
            }

            const invoiceBuffer =
                await generateInvoiceBuffer(
                    existingPayment
                );

            const formattedPlan =
                existingPayment.plan
                    .charAt(0)
                    .toUpperCase() +
                existingPayment.plan.slice(
                    1
                );

            await sendSubscriptionConfirmationEmail(
                {
                    to:
                        currentUser.email,

                    name:
                        currentUser.name ||
                        "User",

                    plan:
                        formattedPlan,

                    amount:
                        existingPayment.amount,

                    currency:
                        existingPayment.currency,

                    invoiceNumber:
                        existingPayment.invoiceNumber,

                    paymentId:
                        existingPayment.razorpayPaymentId,

                    renewalDate:
                        currentSubscription.renewalDate,

                    invoiceBuffer,
                }
            );

            console.log(
                "TEST: Subscription email sent successfully."
            );

            return res.status(200).json({
                message:
                    "Test subscription email sent successfully.",

                data: {
                    email:
                        currentUser.email,

                    invoiceNumber:
                        existingPayment.invoiceNumber,
                },
            });
        } catch (error) {
            console.log(
                "Test subscription email error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to send test subscription email.",

                error:
                    error.message,
            });
        }
    };