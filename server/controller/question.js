import mongoose from "mongoose";
import question from "../models/question.js";
import { updateReputation } from "../utils/reputation.js";

import {
    getOrCreateSubscription,
    getDailyQuestionLimit,
    getPlanDetails,
} from "../utils/subscription.js";

const getIndiaDayRange = () => {
    const now = new Date();

    const indiaDateString =
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(now);

    const [year, month, day] =
        indiaDateString.split("-").map(Number);

    const startOfDay = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            -5,
            -30,
            0,
            0
        )
    );

    const endOfDay = new Date(
        Date.UTC(
            year,
            month - 1,
            day + 1,
            -5,
            -30,
            0,
            0
        )
    );

    return {
        startOfDay,
        endOfDay,
    };
};

export const Askquestion = async (
    req,
    res
) => {
    const { title, body, tags } =
        req.body;

    const userId =
        req.user.userId;

    if (!title || !body) {
        return res.status(400).json({
            message:
                "Title and body are required",
        });
    }

    try {
        const currentUser =
            await mongoose
                .model("user")
                .findById(userId)
                .select(
                    "name email"
                );

        if (!currentUser) {
            return res.status(404).json({
                message:
                    "User not found",
            });
        }

        const userSubscription =
            await getOrCreateSubscription(
                userId,
                currentUser
            );

        const dailyLimit =
            getDailyQuestionLimit(
                userSubscription.plan
            );

        if (
            dailyLimit !==
            Infinity
        ) {
            const {
                startOfDay,
                endOfDay,
            } = getIndiaDayRange();

            const questionsToday =
                await question.countDocuments(
                    {
                        userId,
                        askedOn: {
                            $gte: startOfDay,
                            $lt: endOfDay,
                        },
                    }
                );

            if (
                questionsToday >=
                dailyLimit
            ) {
                return res.status(403).json({
                    message:
                        userSubscription.plan ===
                        "free"
                            ? "You have reached your daily question limit. Upgrade your plan to ask more questions."
                            : `You have reached your ${userSubscription.plan} plan's daily question limit. Upgrade your plan to ask more questions.`,
                    plan:
                        userSubscription.plan,
                    dailyLimit,
                    questionsAsked:
                        questionsToday,
                });
            }
        }

        const postQuestion = {
            title,
            body,
            tags: tags || [],
            userId,
        };

        const postQuestionData =
            new question(
                postQuestion
            );

        await postQuestionData.save();

        res.status(200).json({
            data:
                postQuestionData,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};

/*
 * Get questions
 *
 * Basic search:
 *   ?search=css
 *
 * Advanced filters:
 *   ?tag=javascript
 *   ?unanswered=true
 *   ?minVotes=5
 *   ?sort=newest
 *   ?sort=active
 *   ?sort=votes
 *
 * Free users can use basic keyword
 * search only.
 *
 * Bronze, Silver and Gold users
 * can use advanced filters.
 */
export const getallquestions = async (
    req,
    res
) => {
    try {
        const {
            search,
            tag,
            unanswered,
            minVotes,
            sort,
        } = req.query;

        /*
         * Determine the current user's
         * subscription plan.
         */
        let subscriptionPlan =
            "free";

        let hasAdvancedSearch =
            false;

        if (req.user?.userId) {
            const currentUser =
                await mongoose
                    .model("user")
                    .findById(
                        req.user.userId
                    )
                    .select(
                        "name email"
                    );

            if (currentUser) {
                const userSubscription =
                    await getOrCreateSubscription(
                        req.user.userId,
                        currentUser
                    );

                subscriptionPlan =
                    userSubscription.plan ||
                    "free";

                const planDetails =
                    getPlanDetails(
                        subscriptionPlan
                    );

                hasAdvancedSearch =
                    planDetails.advancedSearch ===
                    true;
            }
        }

        /*
         * Advanced filter parameters are
         * premium-only.
         */
        const requestedAdvancedFilter =
            Boolean(
                (typeof tag ===
                    "string" &&
                    tag.trim()) ||
                    unanswered ===
                        "true" ||
                    (typeof minVotes ===
                        "string" &&
                        minVotes.trim()) ||
                    sort === "active" ||
                    sort === "votes"
            );

        if (
            requestedAdvancedFilter &&
            !hasAdvancedSearch
        ) {
            return res.status(403).json({
                message:
                    "Advanced search filters are available on Bronze, Silver, and Gold plans.",
                plan:
                    subscriptionPlan,
                feature:
                    "advancedSearch",
            });
        }

        const query = {};

        /*
         * Basic keyword search
         */
        if (
            typeof search ===
                "string" &&
            search.trim()
        ) {
            const searchText =
                search.trim();

            const escapedSearch =
                searchText.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

            const searchRegex =
                new RegExp(
                    escapedSearch,
                    "i"
                );

            query.$or = [
                {
                    title: searchRegex,
                },
                {
                    body: searchRegex,
                },
                {
                    tags: searchRegex,
                },
            ];
        }

        /*
         * Advanced tag filter
         */
        if (
            hasAdvancedSearch &&
            typeof tag ===
                "string" &&
            tag.trim()
        ) {
            query.tags = {
                $in: [
                    tag.trim(),
                ],
            };
        }

        /*
         * Advanced unanswered filter
         */
        if (
            hasAdvancedSearch &&
            unanswered === "true"
        ) {
            query.$expr = {
                $eq: [
                    {
                        $size: {
                            $ifNull: [
                                "$answers",
                                [],
                            ],
                        },
                    },
                    0,
                ],
            };
        }

        /*
         * Advanced minimum-vote filter
         */
        if (
            hasAdvancedSearch &&
            typeof minVotes ===
                "string" &&
            minVotes.trim()
        ) {
            const parsedMinVotes =
                Number(minVotes);

            if (
                Number.isNaN(
                    parsedMinVotes
                ) ||
                parsedMinVotes < 0
            ) {
                return res.status(400).json({
                    message:
                        "Invalid minimum vote value.",
                });
            }

            query.votes = {
                $gte:
                    parsedMinVotes,
            };
        }

        /*
         * Sorting
         */
        let sortOption = {
            askedOn: -1,
        };

        if (
            hasAdvancedSearch &&
            sort === "active"
        ) {
            sortOption = {
                "answers.answeredOn":
                    -1,
                askedOn: -1,
            };
        }

        if (
            hasAdvancedSearch &&
            sort === "votes"
        ) {
            sortOption = {
                votes: -1,
                askedOn: -1,
            };
        }

        if (
            sort === "newest" ||
            !hasAdvancedSearch
        ) {
            sortOption = {
                askedOn: -1,
            };
        }

        const allquestions =
            await question
                .find(query)
                .sort(sortOption);

        res.status(200).json({
            data:
                allquestions,

            filters: {
                search:
                    search || "",

                tag:
                    hasAdvancedSearch
                        ? tag || ""
                        : "",

                unanswered:
                    hasAdvancedSearch
                        ? unanswered ===
                          "true"
                        : false,

                minVotes:
                    hasAdvancedSearch
                        ? minVotes || ""
                        : "",

                sort:
                    hasAdvancedSearch
                        ? sort ||
                          "newest"
                        : "newest",
            },

            subscription: {
                plan:
                    subscriptionPlan,

                advancedSearch:
                    hasAdvancedSearch,
            },
        });
    } catch (error) {
        console.log(
            "Get questions error:",
            error
        );

        res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};

export const getquestion = async (
    req,
    res
) => {
    const { id } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(
            id
        )
    ) {
        return res.status(400).json({
            message:
                "Question unavailable",
        });
    }

    try {
        const foundquestion =
            await question.findById(id);

        if (!foundquestion) {
            return res.status(404).json({
                message:
                    "Question not found",
            });
        }

        res.status(200).json({
            data:
                foundquestion,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};

export const deletequestion = async (
    req,
    res
) => {
    const { id } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(
            id
        )
    ) {
        return res.status(400).json({
            message:
                "Question unavailable",
        });
    }

    try {
        const foundquestion =
            await question.findById(id);

        if (!foundquestion) {
            return res.status(404).json({
                message:
                    "Question not found",
            });
        }

        if (
            foundquestion.userId.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                message:
                    "You can only delete your own question",
            });
        }

        await question.findByIdAndDelete(
            id
        );

        res.status(200).json({
            message:
                "deleted successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};

export const adminDeleteQuestion =
    async (req, res) => {
        const { id } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                message:
                    "Question unavailable",
            });
        }

        try {
            const foundquestion =
                await question.findById(
                    id
                );

            if (!foundquestion) {
                return res.status(404).json({
                    message:
                        "Question not found",
                });
            }

            await updateReputation(
                foundquestion.userId,
                -10,
                "Content removed by administrator"
            );

            await question.findByIdAndDelete(
                id
            );

            res.status(200).json({
                message:
                    "Question removed by administrator",
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    "Something went wrong...",
            });
        }
    };

export const voteQuestion = async (
    req,
    res
) => {
    const { id } = req.params;
    const { value } = req.body;

    const userId =
        req.user.userId;

    if (
        !mongoose.Types.ObjectId.isValid(
            id
        )
    ) {
        return res.status(400).json({
            message:
                "Question unavailable",
        });
    }

    if (
        value !== 1 &&
        value !== -1
    ) {
        return res.status(400).json({
            message:
                "Invalid vote",
        });
    }

    try {
        const foundquestion =
            await question.findById(id);

        if (!foundquestion) {
            return res.status(404).json({
                message:
                    "Question not found",
            });
        }

        /*
         * Always keep the stored question
         * score at zero or above.
         */
        if (
            typeof foundquestion.votes !==
                "number" ||
            foundquestion.votes < 0
        ) {
            foundquestion.votes = 0;
        }

        if (
            !foundquestion.upvotedBy
        ) {
            foundquestion.upvotedBy =
                [];
        }

        if (
            !foundquestion.downvotedBy
        ) {
            foundquestion.downvotedBy =
                [];
        }

        const alreadyUpvoted =
            foundquestion.upvotedBy.some(
                (id) =>
                    id.toString() ===
                    userId
            );

        const alreadyDownvoted =
            foundquestion.downvotedBy.some(
                (id) =>
                    id.toString() ===
                    userId
            );

        /*
         * UPVOTE
         */
        if (value === 1) {
            if (
                alreadyUpvoted
            ) {
                /*
                 * Clicking Upvote again
                 * removes the user's upvote.
                 */
                foundquestion.upvotedBy =
                    foundquestion.upvotedBy.filter(
                        (id) =>
                            id.toString() !==
                            userId
                    );

                foundquestion.votes =
                    Math.max(
                        0,
                        foundquestion.votes - 1
                    );
            } else {
                /*
                 * If the user previously
                 * downvoted, remove that
                 * downvote first.
                 *
                 * IMPORTANT:
                 * We do NOT increment here.
                 * Adding the new upvote below
                 * is the only +1.
                 *
                 * This prevents:
                 *
                 * 0 -> downvote -> 0
                 * 0 -> upvote -> 2
                 *
                 * from happening.
                 */
                if (
                    alreadyDownvoted
                ) {
                    foundquestion.downvotedBy =
                        foundquestion.downvotedBy.filter(
                            (id) =>
                                id.toString() !==
                                userId
                        );

                    await updateReputation(
                        foundquestion.userId,
                        2,
                        "Downvote removed"
                    );
                }

                foundquestion.upvotedBy.push(
                    userId
                );

                /*
                 * Switching from a downvote
                 * to an upvote changes the
                 * score by exactly +1.
                 */
                foundquestion.votes =
                    Math.max(
                        0,
                        foundquestion.votes + 1
                    );
            }
        }

        /*
         * DOWNVOTE
         */
        if (value === -1) {
            if (
                alreadyDownvoted
            ) {
                /*
                 * Clicking Downvote again
                 * removes the user's downvote.
                 */
                foundquestion.downvotedBy =
                    foundquestion.downvotedBy.filter(
                        (id) =>
                            id.toString() !==
                            userId
                    );

                /*
                 * If the score was already
                 * zero, keep it at zero.
                 *
                 * Otherwise restore the point
                 * that the downvote removed.
                 */
                if (
                    foundquestion.votes >
                    0
                ) {
                    foundquestion.votes +=
                        1;
                }

                await updateReputation(
                    foundquestion.userId,
                    2,
                    "Downvote removed"
                );
            } else {
                /*
                 * If the user previously
                 * upvoted, remove that upvote.
                 */
                if (
                    alreadyUpvoted
                ) {
                    foundquestion.upvotedBy =
                        foundquestion.upvotedBy.filter(
                            (id) =>
                                id.toString() !==
                                userId
                        );
                }

                /*
                 * Register the downvote.
                 */
                foundquestion.downvotedBy.push(
                    userId
                );

                /*
                 * Never allow the visible
                 * score to become negative.
                 */
                foundquestion.votes =
                    Math.max(
                        0,
                        foundquestion.votes - 1
                    );

                await updateReputation(
                    foundquestion.userId,
                    -2,
                    "Downvote received"
                );
            }
        }

        /*
         * Final safety guard.
         */
        foundquestion.votes =
            Math.max(
                0,
                foundquestion.votes || 0
            );

        /*
         * Reputation reward for reaching
         * ten question upvotes.
         */
        if (
            foundquestion.votes >=
                10 &&
            !foundquestion.reputationRewarded
        ) {
            await updateReputation(
                foundquestion.userId,
                2,
                "Question received 10 upvotes"
            );

            foundquestion.reputationRewarded =
                true;
        }

        await foundquestion.save();

        res.status(200).json({
            data:
                foundquestion,
            message:
                "Vote Updated",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};

/*
 * Report a question
 *
 * Reports are stored in a separate
 * collection so the existing question
 * schema does not need to be changed.
 */
export const reportQuestion = async (
    req,
    res
) => {
    const { id } = req.params;

    const userId =
        req.user?.userId;

    const reason =
        typeof req.body?.reason ===
        "string"
            ? req.body.reason.trim()
            : "";

    if (
        !mongoose.Types.ObjectId.isValid(
            id
        )
    ) {
        return res.status(400).json({
            message:
                "Invalid question ID.",
        });
    }

    if (!userId) {
        return res.status(401).json({
            message:
                "Authentication required.",
        });
    }

    if (!reason) {
        return res.status(400).json({
            message:
                "A report reason is required.",
        });
    }

    if (reason.length > 500) {
        return res.status(400).json({
            message:
                "Report reason must be 500 characters or less.",
        });
    }

    try {
        const foundQuestion =
            await question.findById(id);

        if (!foundQuestion) {
            return res.status(404).json({
                message:
                    "Question not found.",
            });
        }

        const QuestionReport =
            mongoose.models.questionReport ||
            mongoose.model(
                "questionReport",
                new mongoose.Schema(
                    {
                        questionId: {
                            type:
                                mongoose
                                    .Schema
                                    .Types
                                    .ObjectId,
                            required: true,
                            ref: "question",
                        },

                        userId: {
                            type:
                                mongoose
                                    .Schema
                                    .Types
                                    .ObjectId,
                            required: true,
                            ref: "user",
                        },

                        reason: {
                            type: String,
                            required: true,
                            trim: true,
                            maxlength: 500,
                        },
                    },
                    {
                        timestamps: true,
                    }
                )
            );

        const existingReport =
            await QuestionReport.findOne({
                questionId: id,
                userId,
            });

        if (existingReport) {
            return res.status(409).json({
                message:
                    "You have already reported this question.",
            });
        }

        const report =
            await QuestionReport.create({
                questionId: id,
                userId,
                reason,
            });

        return res.status(201).json({
            message:
                "Question reported successfully.",
            data:
                report,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                "Something went wrong...",
        });
    }
};