import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "question",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

bookmarkSchema.index(
    {
        userId: 1,
        questionId: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model(
    "bookmark",
    bookmarkSchema
);