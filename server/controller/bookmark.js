import mongoose from "mongoose";

import bookmark from "../models/bookmark.js";
import question from "../models/question.js";
import {
    getOrCreateSubscription,
    getPlanDetails,
} from "../utils/subscription.js";

const LIMITED_BOOKMARKS = 5;

const getUserSubscription = async (
    userId
) => {
    const currentUser =
        await mongoose
            .model("user")
            .findById(userId)
            .select("name email");

    if (!currentUser) {
        return null;
    }

    return getOrCreateSubscription(
        userId,
        currentUser
    );
};

export const addBookmark = async (
    req,
    res
) => {
    const userId =
        req.user.userId;

    const { questionId } =
        req.body;

    if (
        !questionId ||
        !mongoose.Types.ObjectId.isValid(
            questionId
        )
    ) {
        return res.status(400).json({
            message:
                "Valid question ID is required.",
        });
    }

    try {
        const foundQuestion =
            await question.findById(
                questionId
            );

        if (!foundQuestion) {
            return res.status(404).json({
                message:
                    "Question not found.",
            });
        }

        const existingBookmark =
            await bookmark.findOne({
                userId,
                questionId,
            });

        if (existingBookmark) {
            return res.status(200).json({
                message:
                    "Question is already bookmarked.",
                data: {
                    isBookmarked: true,
                },
            });
        }

        const userSubscription =
            await getUserSubscription(
                userId
            );

        if (!userSubscription) {
            return res.status(404).json({
                message:
                    "User not found.",
            });
        }

        const planDetails =
            getPlanDetails(
                userSubscription.plan
            );

        const currentBookmarkCount =
            await bookmark.countDocuments({
                userId,
            });

        /*
         * Silver and Gold have unlimited
         * bookmarks.
         *
         * Free and Bronze are limited
         * to 5 bookmarks.
         */
        if (
            !planDetails.unlimitedBookmarks &&
            currentBookmarkCount >=
                LIMITED_BOOKMARKS
        ) {
            return res.status(403).json({
                message:
                    `Your ${userSubscription.plan} plan allows a maximum of ${LIMITED_BOOKMARKS} bookmarks. Upgrade to Silver or Gold for unlimited bookmarks.`,
                plan:
                    userSubscription.plan,
                bookmarkLimit:
                    LIMITED_BOOKMARKS,
                bookmarkCount:
                    currentBookmarkCount,
            });
        }

        const newBookmark =
            await bookmark.create({
                userId,
                questionId,
            });

        res.status(201).json({
            message:
                "Question bookmarked successfully.",
            data: {
                bookmark:
                    newBookmark,
                isBookmarked: true,
                bookmarkCount:
                    currentBookmarkCount +
                    1,
                unlimited:
                    planDetails.unlimitedBookmarks,
            },
        });
    } catch (error) {
        console.log(
            "Add bookmark error:",
            error
        );

        /*
         * Handles the unique index race
         * condition gracefully.
         */
        if (
            error.code === 11000
        ) {
            return res.status(200).json({
                message:
                    "Question is already bookmarked.",
                data: {
                    isBookmarked: true,
                },
            });
        }

        res.status(500).json({
            message:
                "Unable to bookmark question.",
        });
    }
};

export const removeBookmark = async (
    req,
    res
) => {
    const userId =
        req.user.userId;

    const { questionId } =
        req.params;

    if (
        !mongoose.Types.ObjectId.isValid(
            questionId
        )
    ) {
        return res.status(400).json({
            message:
                "Valid question ID is required.",
        });
    }

    try {
        const deletedBookmark =
            await bookmark.findOneAndDelete(
                {
                    userId,
                    questionId,
                }
            );

        if (!deletedBookmark) {
            return res.status(404).json({
                message:
                    "Bookmark not found.",
            });
        }

        const remainingBookmarks =
            await bookmark.countDocuments({
                userId,
            });

        res.status(200).json({
            message:
                "Bookmark removed successfully.",
            data: {
                isBookmarked: false,
                bookmarkCount:
                    remainingBookmarks,
            },
        });
    } catch (error) {
        console.log(
            "Remove bookmark error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to remove bookmark.",
        });
    }
};

export const getBookmarks = async (
    req,
    res
) => {
    const userId =
        req.user.userId;

    try {
        const userSubscription =
            await getUserSubscription(
                userId
            );

        if (!userSubscription) {
            return res.status(404).json({
                message:
                    "User not found.",
            });
        }

        const planDetails =
            getPlanDetails(
                userSubscription.plan
            );

        const bookmarks =
            await bookmark
                .find({ userId })
                .sort({
                    createdAt: -1,
                })
                .populate({
                    path: "questionId",
                    select:
                        "title body tags votes answers userId askedOn",
                });

        res.status(200).json({
            data: bookmarks,
            subscription: {
                plan:
                    userSubscription.plan,
                unlimitedBookmarks:
                    planDetails.unlimitedBookmarks,
                bookmarkLimit:
                    planDetails.unlimitedBookmarks
                        ? null
                        : LIMITED_BOOKMARKS,
                bookmarkCount:
                    bookmarks.length,
            },
        });
    } catch (error) {
        console.log(
            "Get bookmarks error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to get bookmarks.",
        });
    }
};

export const getBookmarkStatus =
    async (req, res) => {
        const userId =
            req.user.userId;

        const { questionId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                questionId
            )
        ) {
            return res.status(400).json({
                message:
                    "Valid question ID is required.",
            });
        }

        try {
            const foundBookmark =
                await bookmark.findOne({
                    userId,
                    questionId,
                });

            res.status(200).json({
                data: {
                    isBookmarked:
                        Boolean(
                            foundBookmark
                        ),
                },
            });
        } catch (error) {
            console.log(
                "Get bookmark status error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to get bookmark status.",
            });
        }
    };