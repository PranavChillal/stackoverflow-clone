import express from "express";

import {
    Askquestion,
    getallquestions,
    getquestion,
    deletequestion,
    voteQuestion,
} from "../controller/question.js";

import {
    postAnswer,
    deleteAnswer,
} from "../controller/answer.js";

const router = express.Router();

router.post("/ask", Askquestion);

router.get("/getallquestions", getallquestions);

router.get("/getquestion/:id", getquestion);

router.delete("/deletequestion/:id", deletequestion);

router.post("/answer", postAnswer);

router.delete(
    "/answer/:questionId/:answerId",
    deleteAnswer
);

router.patch("/vote/:id", voteQuestion);

export default router;