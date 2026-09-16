import mongoose from "mongoose";

const notificationSchema =
    new mongoose.Schema({
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            default: null,
        },

        type: {
            type: String,
            enum: [
                "like",
                "comment",
                "reply",
                "mention",
                "follow",
                "share",
                "report",
                "admin",
            ],
            required: true,
        },

        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post",
            default: null,
        },

        message: {
            type: String,
            required: true,
        },

        read: {
            type: Boolean,
            default: false,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    });

notificationSchema.index({
    recipientId: 1,
    createdAt: -1,
});

export default mongoose.model(
    "notification",
    notificationSchema
);