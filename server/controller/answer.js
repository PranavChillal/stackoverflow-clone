import mongoose from "mongoose";
import question from "../models/question.js";
import { updateReputation } from "../utils/reputation.js";

export const postAnswer = async (req, res) => {
    const { questionId, answerBody } = req.body;

    const userId = req.user.userId;

    if (!questionId || !answerBody) {
        return res.status(400).json({
            message: "Question ID and answer are required",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({
            message: "Question unavailable",
        });
    }

    try {
        const foundQuestion = await question.findById(questionId);

        if (!foundQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        foundQuestion.answers.push({
            answerBody,
            userId,
        });

        await foundQuestion.save();

        await updateReputation(
            userId,
            5,
            "Answer posted"
        );

        res.status(200).json({
            data: foundQuestion,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const deleteAnswer = async (req, res) => {
    const { questionId, answerId } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(questionId) ||
        !mongoose.Types.ObjectId.isValid(answerId)
    ) {
        return res.status(400).json({
            message: "Question or answer unavailable",
        });
    }

    try {
        const foundQuestion = await question.findById(
            questionId
        );

        if (!foundQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        const answer =
            foundQuestion.answers.id(answerId);

        if (!answer) {
            return res.status(404).json({
                message: "Answer not found",
            });
        }

        if (
            answer.userId.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                message:
                    "You can only delete your own answer",
            });
        }

        foundQuestion.answers =
            foundQuestion.answers.filter(
                (answer) =>
                    answer._id.toString() !== answerId
            );

        await foundQuestion.save();

        await updateReputation(
            answer.userId,
            -5,
            "Answer deleted"
        );

        res.status(200).json({
            message: "deleted successfully",
            data: foundQuestion,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const acceptAnswer = async (req, res) => {
    const { questionId, answerId } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(questionId) ||
        !mongoose.Types.ObjectId.isValid(answerId)
    ) {
        return res.status(400).json({
            message: "Question or answer unavailable",
        });
    }

    try {
        const foundQuestion = await question.findById(
            questionId
        );

        if (!foundQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        if (
            foundQuestion.userId.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                message:
                    "Only the question owner can accept an answer",
            });
        }

        const answer =
            foundQuestion.answers.id(answerId);

        if (!answer) {
            return res.status(404).json({
                message: "Answer not found",
            });
        }

        if (foundQuestion.acceptedAnswerId) {
            return res.status(400).json({
                message:
                    "An answer has already been accepted",
            });
        }

        foundQuestion.acceptedAnswerId = answerId;

        await foundQuestion.save();

        await updateReputation(
            answer.userId,
            10,
            "Answer accepted"
        );

        res.status(200).json({
            message: "Answer accepted successfully",
            data: foundQuestion,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const voteAnswer = async (req, res) => {
    const { questionId, answerId } = req.params;
    const { value } = req.body;

    const userId = req.user.userId;

    if (
        !mongoose.Types.ObjectId.isValid(questionId) ||
        !mongoose.Types.ObjectId.isValid(answerId)
    ) {
        return res.status(400).json({
            message: "Question or answer unavailable",
        });
    }

    if (value !== 1 && value !== -1) {
        return res.status(400).json({
            message: "Invalid vote",
        });
    }

    try {
        const foundQuestion = await question.findById(
            questionId
        );

        if (!foundQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        const answer =
            foundQuestion.answers.id(answerId);

        if (!answer) {
            return res.status(404).json({
                message: "Answer not found",
            });
        }

        if (!answer.upvotedBy) {
            answer.upvotedBy = [];
        }

        if (!answer.downvotedBy) {
            answer.downvotedBy = [];
        }

        const alreadyUpvoted =
            answer.upvotedBy.some(
                (id) => id.toString() === userId
            );

        const alreadyDownvoted =
            answer.downvotedBy.some(
                (id) => id.toString() === userId
            );

        // Always normalize the current vote count.
        // This protects older answers that may already
        // contain an invalid negative value.
        answer.votes = Math.max(
            0,
            Number(answer.votes) || 0
        );

        if (value === 1) {
            if (alreadyUpvoted) {
                answer.upvotedBy =
                    answer.upvotedBy.filter(
                        (id) =>
                            id.toString() !== userId
                    );

                answer.votes = Math.max(
                    0,
                    answer.votes - 1
                );
            } else {
                if (alreadyDownvoted) {
                    answer.downvotedBy =
                        answer.downvotedBy.filter(
                            (id) =>
                                id.toString() !== userId
                        );

                    answer.votes += 1;

                    await updateReputation(
                        answer.userId,
                        2,
                        "Downvote removed"
                    );
                }

                answer.upvotedBy.push(userId);
                answer.votes += 1;
            }
        }

        if (value === -1) {
            if (alreadyDownvoted) {
                answer.downvotedBy =
                    answer.downvotedBy.filter(
                        (id) =>
                            id.toString() !== userId
                    );

                answer.votes += 1;

                await updateReputation(
                    answer.userId,
                    2,
                    "Downvote removed"
                );
            } else {
                if (alreadyUpvoted) {
                    answer.upvotedBy =
                        answer.upvotedBy.filter(
                            (id) =>
                                id.toString() !== userId
                        );

                    answer.votes = Math.max(
                        0,
                        answer.votes - 1
                    );
                }

                answer.downvotedBy.push(userId);

                answer.votes = Math.max(
                    0,
                    answer.votes - 1
                );

                await updateReputation(
                    answer.userId,
                    -2,
                    "Downvote received"
                );
            }
        }

        // Final safety check so the database can never
        // receive a negative answer score.
        answer.votes = Math.max(
            0,
            Number(answer.votes) || 0
        );

        if (
            answer.votes >= 5 &&
            !answer.reputationRewarded
        ) {
            await updateReputation(
                answer.userId,
                5,
                "Answer received 5 upvotes"
            );

            answer.reputationRewarded = true;
        }

        await foundQuestion.save();

        res.status(200).json({
            data: foundQuestion,
            message: "Answer vote updated",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

/*
 * Report an answer
 *
 * Reports are stored separately from the question itself so
 * reporting an answer does not modify or delete the answer.
 */

const AnswerReport =
    mongoose.models.answerReport ||
    mongoose.model(
        "answerReport",
        new mongoose.Schema(
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "question",
                },
                answerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "user",
                },
                reason: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 500,
                },
            },
            {
                timestamps: true,
            }
        )
    );

export const reportAnswer = async (req, res) => {
    const { questionId, answerId } = req.params;
    const { reason } = req.body;

    const userId = req.user.userId;

    if (
        !mongoose.Types.ObjectId.isValid(questionId) ||
        !mongoose.Types.ObjectId.isValid(answerId)
    ) {
        return res.status(400).json({
            message: "Question or answer unavailable",
        });
    }

    if (
        typeof reason !== "string" ||
        !reason.trim()
    ) {
        return res.status(400).json({
            message: "Report reason is required",
        });
    }

    const trimmedReason = reason.trim();

    if (trimmedReason.length > 500) {
        return res.status(400).json({
            message:
                "Report reason must be 500 characters or less",
        });
    }

    try {
        const foundQuestion =
            await question.findById(questionId);

        if (!foundQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        const answer =
            foundQuestion.answers.id(answerId);

        if (!answer) {
            return res.status(404).json({
                message: "Answer not found",
            });
        }

        const existingReport =
            await AnswerReport.findOne({
                questionId,
                answerId,
                userId,
            });

        if (existingReport) {
            return res.status(409).json({
                message:
                    "You have already reported this answer",
            });
        }

        await AnswerReport.create({
            questionId,
            answerId,
            userId,
            reason: trimmedReason,
        });

        return res.status(201).json({
            message:
                "Answer report submitted successfully",
        });
    } catch (error) {
        console.log("Report answer error:", error);

        return res.status(500).json({
            message: "Something went wrong...",
        });
    }
};