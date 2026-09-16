import express from "express";

import {
    addBookmark,
    removeBookmark,
    getBookmarks,
    getBookmarkStatus,
} from "../controller/bookmark.js";

import { authenticate } from "../middleware/auth.js";

const router =
    express.Router();

router.post(
    "/add",
    authenticate,
    addBookmark
);

router.delete(
    "/remove/:questionId",
    authenticate,
    removeBookmark
);

router.get(
    "/",
    authenticate,
    getBookmarks
);

router.get(
    "/status/:questionId",
    authenticate,
    getBookmarkStatus
);

export default router;