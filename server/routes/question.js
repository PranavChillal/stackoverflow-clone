import express from "express";

import {
    Askquestion,
    getallquestions,
    getquestion,
    deletequestion,
    voteQuestion,
    adminDeleteQuestion,
    reportQuestion,
} from "../controller/question.js";

import {
    postAnswer,
    deleteAnswer,
    acceptAnswer,
    voteAnswer,
    reportAnswer,
} from "../controller/answer.js";

import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { requireReputation } from "../middleware/reputation.js";

const router = express.Router();

router.post(
    "/ask",
    authenticate,
    Askquestion
);

router.get(
    "/getallquestions",
    authenticate,
    getallquestions
);

router.get(
    "/getquestion/:id",
    getquestion
);

router.delete(
    "/deletequestion/:id",
    authenticate,
    deletequestion
);

router.post(
    "/answer",
    authenticate,
    postAnswer
);

router.delete(
    "/answer/:questionId/:answerId",
    authenticate,
    deleteAnswer
);

router.patch(
    "/vote/:id",
    authenticate,
    voteQuestion
);

router.patch(
    "/accept/:questionId/:answerId",
    authenticate,
    acceptAnswer
);

router.patch(
    "/answer-vote/:questionId/:answerId",
    authenticate,
    voteAnswer
);

router.post(
    "/report/:id",
    authenticate,
    requireReputation("canReportContent"),
    reportQuestion
);

router.post(
    "/answer/report/:questionId/:answerId",
    authenticate,
    requireReputation("canReportContent"),
    reportAnswer
);

router.delete(
    "/admin/delete-question/:id",
    authenticate,
    adminOnly,
    adminDeleteQuestion
);

export default router;