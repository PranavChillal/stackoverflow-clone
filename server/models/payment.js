import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subscription",
            required: true,
        },

        plan: {
            type: String,
            enum: ["bronze", "silver", "gold"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "INR",
        },

        status: {
            type: String,
            enum: [
                "created",
                "pending",
                "paid",
                "failed",
                "refunded",
            ],
            default: "created",
        },

        razorpayOrderId: {
            type: String,
            required: true,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },

        razorpaySignature: {
            type: String,
            default: null,
        },

        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },

        billingDetails: {
            name: {
                type: String,
                default: "",
            },

            email: {
                type: String,
                default: "",
            },

            phone: {
                type: String,
                default: "",
            },

            address: {
                type: String,
                default: "",
            },

            city: {
                type: String,
                default: "",
            },

            state: {
                type: String,
                default: "",
            },

            postalCode: {
                type: String,
                default: "",
            },

            country: {
                type: String,
                default: "India",
            },
        },

        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "payment",
    paymentSchema
);