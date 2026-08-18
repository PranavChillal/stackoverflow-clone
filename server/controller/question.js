import mongoose from "mongoose";
import question from "../models/question.js";

export const Askquestion = async (req, res) => {
    const postQuestion = req.body;

    const postQuestionData = new question(postQuestion);

    try {
        await postQuestionData.save();

        res.status(200).json({
            data: postQuestionData,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const getallquestions = async (req, res) => {
    try {
        const allquestions = await question.find();

        res.status(200).json({
            data: allquestions,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const getquestion = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Question unavailable",
        });
    }

    try {
        const foundquestion = await question.findById(id);

        if (!foundquestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        res.status(200).json({
            data: foundquestion,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const deletequestion = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Question unavailable",
        });
    }

    try {
        const deletedQuestion = await question.findByIdAndDelete(id);

        if (!deletedQuestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        res.status(200).json({
            message: "deleted successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const voteQuestion = async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Question unavailable",
        });
    }

    if (value !== 1 && value !== -1) {
        return res.status(400).json({
            message: "Invalid vote",
        });
    }

    try {
        const foundquestion = await question.findById(id);

        if (!foundquestion) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        foundquestion.votes += value;

        await foundquestion.save();

        res.status(200).json({
            data: foundquestion,
            message: "Vote Updated",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};