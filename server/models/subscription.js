import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            unique: true,
        },

        plan: {
            type: String,
            enum: ["free", "bronze", "silver", "gold"],
            default: "free",
        },

        status: {
            type: String,
            enum: [
                "active",
                "cancelled",
                "expired",
                "pending",
                "created",
            ],
            default: "active",
        },

        amount: {
            type: Number,
            default: 0,
        },

        currency: {
            type: String,
            default: "INR",
        },

        startDate: {
            type: Date,
            default: Date.now,
        },

        renewalDate: {
            type: Date,
            default: null,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        razorpaySubscriptionId: {
            type: String,
            default: null,
        },

        razorpayCustomerId: {
            type: String,
            default: null,
        },

        currentPaymentId: {
            type: String,
            default: null,
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
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "subscription",
    subscriptionSchema
);