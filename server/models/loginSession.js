import mongoose from "mongoose";

const loginSessionSchema =
    new mongoose.Schema(
        {
            userId: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "user",
                required: true,
                index: true,
            },

            sessionTokenHash: {
                type: String,
                required: true,
                unique: true,
            },

            browser: {
                type: String,
                default: "Unknown",
            },

            operatingSystem: {
                type: String,
                default: "Unknown",
            },

            deviceType: {
                type: String,
                enum: [
                    "desktop",
                    "mobile",
                    "tablet",
                    "unknown",
                ],
                default: "unknown",
            },

            ipAddress: {
                type: String,
                default: "",
            },

            location: {
                type: String,
                default: "",
            },

            loginAt: {
                type: Date,
                default: Date.now,
            },

            lastActivityAt: {
                type: Date,
                default: Date.now,
            },

            trustedDevice: {
                type: Boolean,
                default: false,
            },

            /*
            |--------------------------------------------------------------------------
            | OTP Verification
            |--------------------------------------------------------------------------
            */

            otpHash: {
                type: String,
                default: null,
            },

            otpExpiresAt: {
                type: Date,
                default: null,
            },

            otpAttempts: {
                type: Number,
                default: 0,
            },

            otpVerified: {
                type: Boolean,
                default: true,
            },

            pendingVerification: {
                type: Boolean,
                default: false,
            },

            revoked: {
                type: Boolean,
                default: false,
            },

            revokedAt: {
                type: Date,
                default: null,
            },

            expiresAt: {
                type: Date,
                required: true,
            },
        },
        {
            timestamps: true,
        }
    );

loginSessionSchema.index({
    expiresAt: 1,
});

loginSessionSchema.index({
    userId: 1,
    revoked: 1,
    lastActivityAt: -1,
});

export default mongoose.model(
    "loginSession",
    loginSessionSchema
);