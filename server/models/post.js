import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        body: {
            type: String,
            required: true,
            trim: true,
        },

        parentCommentId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },

        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: true,
    }
);

const reportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
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
    },
    {
        _id: true,
    }
);

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    content: {
        type: String,
        default: "",
        trim: true,
    },

    postType: {
        type: String,
        enum: [
            "update",
            "image",
            "code",
            "project",
            "achievement",
        ],
        default: "update",
    },

    imageUrl: {
        type: String,
        default: "",
    },

    codeSnippet: {
        type: String,
        default: "",
    },

    projectUrl: {
        type: String,
        default: "",
    },

    hashtags: {
        type: [String],
        default: [],
    },

    likes: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    comments: {
        type: [commentSchema],
        default: [],
    },

    shares: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    bookmarks: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        default: [],
    },

    reports: {
        type: [reportSchema],
        default: [],
    },

    status: {
        type: String,
        enum: [
            "active",
            "removed",
            "under_review",
        ],
        default: "active",
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

postSchema.index({
    createdAt: -1,
});

postSchema.index({
    hashtags: 1,
});

postSchema.index({
    status: 1,
    createdAt: -1,
});

export default mongoose.model(
    "post",
    postSchema
);