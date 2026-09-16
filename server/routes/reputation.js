import express from "express";

import {
    transferReputation,
    getMyReputationTransfers,
} from "../controller/reputation.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post(
    "/transfer",
    authenticate,
    transferReputation
);

router.get(
    "/transfers",
    authenticate,
    getMyReputationTransfers
);

export default router;