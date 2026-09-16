import mongoose from "mongoose";

const answerSchema = mongoose.Schema({
    answerBody: {
        type: String,
        required: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    answeredOn: {
        type: Date,
        default: Date.now,
    },

    votes: {
        type: Number,
        default: 0,
    },

    upvotedBy: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    downvotedBy: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    reputationRewarded: {
        type: Boolean,
        default: false,
    },
});

const questionSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    body: {
        type: String,
        required: true,
    },

    tags: {
        type: [String],
        default: [],
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    askedOn: {
        type: Date,
        default: Date.now,
    },

    votes: {
        type: Number,
        default: 0,
    },

    upvotedBy: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    downvotedBy: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    reputationRewarded: {
        type: Boolean,
        default: false,
    },

    acceptedAnswerId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },

    answers: {
        type: [answerSchema],
        default: [],
    },
});

export default mongoose.model("question", questionSchema);