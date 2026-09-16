import mongoose from "mongoose";

const userschema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
    },

    phone: {
        type: String,
        default: "",
    },

    password: {
        type: String,
        required: true,
    },

    about: {
        type: String,
    },

    tags: {
        type: [String],
    },

    joinDate: {
        type: Date,
        default: Date.now,
    },

    reputation: {
        type: Number,
        default: 0,
    },

    profileRewarded: {
        type: Boolean,
        default: false,
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },

    forgotPasswordLastRequestedAt: {
        type: Date,
        default: null,
    },

    preferredLanguage: {
        type: String,
        enum: [
            "english",
            "spanish",
            "hindi",
            "portuguese",
            "chinese",
            "french",
        ],
        default: "english",
    },

    languageOtp: {
        type: String,
        default: null,
    },

    languageOtpExpiresAt: {
        type: Date,
        default: null,
    },

    languageOtpTarget: {
        type: String,
        default: null,
    },

    languageOtpVerified: {
        type: Boolean,
        default: false,
    },

    /*
    |--------------------------------------------------------------------------
    | Community Following
    |--------------------------------------------------------------------------
    */

    followers: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    following: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    suspended: {
        type: Boolean,
        default: false,
    },

    suspensionReason: {
        type: String,
        default: "",
    },
});

export default mongoose.model(
    "user",
    userschema
);