import express from "express";

import {
    createPost,
    getFeed,
    getTrendingPosts,
    getPost,
    editPost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    sharePost,
    toggleBookmark,
    reportPost,
    getNotifications,
    markNotificationsRead,
    getAdminReports,
    adminRemovePost,
    adminSuspendUser,
} from "../controller/post.js";

import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { requireReputation } from "../middleware/reputation.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Community Feed
|--------------------------------------------------------------------------
*/

router.get(
    "/feed",
    getFeed
);

router.get(
    "/trending",
    getTrendingPosts
);

router.get(
    "/notifications",
    authenticate,
    getNotifications
);

router.patch(
    "/notifications/read",
    authenticate,
    markNotificationsRead
);

/*
|--------------------------------------------------------------------------
| Posts
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authenticate,
    createPost
);

router.get(
    "/:id",
    getPost
);

router.patch(
    "/:id",
    authenticate,
    requireReputation("canEditPosts"),
    editPost
);

router.delete(
    "/:id",
    authenticate,
    deletePost
);

/*
|--------------------------------------------------------------------------
| Engagement
|--------------------------------------------------------------------------
*/

router.patch(
    "/:id/like",
    authenticate,
    toggleLike
);

router.patch(
    "/:id/bookmark",
    authenticate,
    toggleBookmark
);

router.post(
    "/:id/share",
    authenticate,
    sharePost
);

router.post(
    "/:id/comment",
    authenticate,
    requireReputation("canComment"),
    addComment
);

router.delete(
    "/:id/comment/:commentId",
    authenticate,
    deleteComment
);

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/report",
    authenticate,
    requireReputation("canReportContent"),
    reportPost
);

/*
|--------------------------------------------------------------------------
| Admin Moderation
|--------------------------------------------------------------------------
*/

/*
 * Get all posts currently under review.
 */
router.get(
    "/admin/reports",
    authenticate,
    adminOnly,
    getAdminReports
);

/*
 * Remove a reported post.
 */
router.delete(
    "/admin/:id",
    authenticate,
    adminOnly,
    adminRemovePost
);

/*
 * Suspend a user.
 */
router.patch(
    "/admin/user/:userId/suspend",
    authenticate,
    adminOnly,
    adminSuspendUser
);

export default router;