import mongoose from "mongoose";

const reputationHistorySchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    reason: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        enum: ["earned", "lost"],
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model(
    "reputationHistory",
    reputationHistorySchema
);