import mongoose from "mongoose";

const reputationTransferSchema = mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    amount: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
    },

    reason: {
        type: String,
        required: true,
        trim: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model(
    "reputationTransfer",
    reputationTransferSchema
);