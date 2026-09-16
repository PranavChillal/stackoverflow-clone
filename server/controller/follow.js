import user from "../models/auth.js";
import Notification from "../models/notification.js";

/*
|--------------------------------------------------------------------------
| Toggle Follow
|--------------------------------------------------------------------------
*/

export const toggleFollow = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const targetUserId = req.params.id;

        console.log(
            "FOLLOW:",
            currentUserId,
            "->",
            targetUserId
        );

        if (
            currentUserId.toString() ===
            targetUserId.toString()
        ) {
            return res.status(400).json({
                message:
                    "You cannot follow yourself.",
            });
        }

        const currentUser =
            await user.findById(currentUserId);

        const targetUser =
            await user.findById(targetUserId);

        if (!currentUser) {
            return res.status(404).json({
                message:
                    "Current user not found.",
            });
        }

        if (!targetUser) {
            return res.status(404).json({
                message:
                    "User not found.",
            });
        }

        if (targetUser.suspended) {
            return res.status(403).json({
                message:
                    "You cannot follow a suspended user.",
            });
        }

        const alreadyFollowing =
            currentUser.following.some(
                (id) =>
                    id.toString() ===
                    targetUserId.toString()
            );

        /*
        |--------------------------------------------------------------------------
        | Unfollow
        |--------------------------------------------------------------------------
        */

        if (alreadyFollowing) {
            currentUser.following =
                currentUser.following.filter(
                    (id) =>
                        id.toString() !==
                        targetUserId.toString()
                );

            targetUser.followers =
                targetUser.followers.filter(
                    (id) =>
                        id.toString() !==
                        currentUserId.toString()
                );

            await currentUser.save();
            await targetUser.save();

            console.log(
                "UNFOLLOW COMPLETE"
            );

            return res.status(200).json({
                data: {
                    following: false,
                    followers:
                        targetUser.followers.length,
                },
                message:
                    "User unfollowed successfully.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Follow
        |--------------------------------------------------------------------------
        */

        currentUser.following.push(
            targetUser._id
        );

        targetUser.followers.push(
            currentUser._id
        );

        await currentUser.save();
        await targetUser.save();

        console.log(
            "FOLLOW SAVED:",
            currentUser._id.toString(),
            "->",
            targetUser._id.toString()
        );

        /*
        |--------------------------------------------------------------------------
        | Create Follow Notification
        |--------------------------------------------------------------------------
        */

        const notification =
            await Notification.create({
                recipientId: targetUser._id,
                senderId: currentUser._id,
                type: "follow",
                postId: null,
                message:
                    "started following you.",
            });

        console.log(
            "NOTIFICATION CREATED:",
            notification._id.toString(),
            "recipient:",
            notification.recipientId.toString()
        );

        return res.status(200).json({
            data: {
                following: true,
                followers:
                    targetUser.followers.length,
            },
            message:
                "User followed successfully.",
        });
    } catch (error) {
        console.error(
            "Toggle follow error:",
            error
        );

        return res.status(500).json({
            message:
                "Something went wrong while updating follow status.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get Follow Status
|--------------------------------------------------------------------------
*/

export const getFollowStatus = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const targetUserId = req.params.id;

        const currentUser =
            await user.findById(currentUserId);

        const targetUser =
            await user.findById(targetUserId);

        if (!currentUser) {
            return res.status(404).json({
                message:
                    "Current user not found.",
            });
        }

        if (!targetUser) {
            return res.status(404).json({
                message:
                    "User not found.",
            });
        }

        const following =
            currentUser.following.some(
                (id) =>
                    id.toString() ===
                    targetUserId.toString()
            );

        return res.status(200).json({
            data: {
                following,
                followers:
                    targetUser.followers.length,
                followingCount:
                    targetUser.following.length,
            },
        });
    } catch (error) {
        console.error(
            "Get follow status error:",
            error
        );

        return res.status(500).json({
            message:
                "Something went wrong.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get My Following
|--------------------------------------------------------------------------
*/

export const getMyFollowing = async (req, res) => {
    try {
        const currentUserId =
            req.user.userId;

        const currentUser =
            await user
                .findById(currentUserId)
                .select("following")
                .populate(
                    "following",
                    "name email about tags reputation"
                );

        if (!currentUser) {
            return res.status(404).json({
                message:
                    "Current user not found.",
            });
        }

        return res.status(200).json({
            data:
                currentUser.following,
        });
    } catch (error) {
        console.error(
            "Get my following error:",
            error
        );

        return res.status(500).json({
            message:
                "Something went wrong.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get My Followers
|--------------------------------------------------------------------------
*/

export const getMyFollowers = async (req, res) => {
    try {
        const currentUserId =
            req.user.userId;

        const currentUser =
            await user
                .findById(currentUserId)
                .select("followers")
                .populate(
                    "followers",
                    "name email about tags reputation"
                );

        if (!currentUser) {
            return res.status(404).json({
                message:
                    "Current user not found.",
            });
        }

        return res.status(200).json({
            data:
                currentUser.followers,
        });
    } catch (error) {
        console.error(
            "Get my followers error:",
            error
        );

        return res.status(500).json({
            message:
                "Something went wrong.",
        });
    }
};