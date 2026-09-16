import express from "express";

import {
    toggleFollow,
    getFollowStatus,
    getMyFollowing,
    getMyFollowers,
} from "../controller/follow.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Toggle Follow
|--------------------------------------------------------------------------
*/

router.patch(
    "/:id",
    authenticate,
    toggleFollow
);

/*
|--------------------------------------------------------------------------
| Follow Status
|--------------------------------------------------------------------------
*/

router.get(
    "/status/:id",
    authenticate,
    getFollowStatus
);

/*
|--------------------------------------------------------------------------
| My Following
|--------------------------------------------------------------------------
*/

router.get(
    "/following",
    authenticate,
    getMyFollowing
);

/*
|--------------------------------------------------------------------------
| My Followers
|--------------------------------------------------------------------------
*/

router.get(
    "/followers",
    authenticate,
    getMyFollowers
);

export default router;