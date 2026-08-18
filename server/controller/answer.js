import mongoose from "mongoose";
import question from "../models/question.js";

export const postAnswer = async (req, res) => {
    const { questionId, answerBody, userId } = req.body;

    if (!questionId || !answerBody || !userId) {
        return res.status(400).json({
            message: "Question ID, answer and user ID are required",
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
        const foundQuestion = await question.findById(questionId);

        if (!foundQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        const answerExists = foundQuestion.answers.some(
            (answer) => answer._id.toString() === answerId
        );

        if (!answerExists) {
            return res.status(404).json({
                message: "Answer not found",
            });
        }

        foundQuestion.answers = foundQuestion.answers.filter(
            (answer) => answer._id.toString() !== answerId
        );

        await foundQuestion.save();

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