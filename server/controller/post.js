import mongoose from "mongoose";

import Post from "../models/post.js";
import Notification from "../models/notification.js";
import user from "../models/auth.js";

/*
|--------------------------------------------------------------------------
| Extract Hashtags
|--------------------------------------------------------------------------
*/

const extractHashtags = (text = "") => {
    const matches =
        text.match(
            /#[a-zA-Z0-9_]+/g
        ) || [];

    return [
        ...new Set(
            matches.map((tag) =>
                tag
                    .substring(1)
                    .toLowerCase()
            )
        ),
    ];
};

/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
*/

const createNotification =
    async ({
        recipientId,
        senderId,
        type,
        postId,
        message,
    }) => {
        if (
            !recipientId ||
            !senderId
        ) {
            return;
        }

        if (
            recipientId.toString() ===
            senderId.toString()
        ) {
            return;
        }

        await Notification.create({
            recipientId,
            senderId,
            type,
            postId:
                postId || null,
            message,
        });
    };

/*
|--------------------------------------------------------------------------
| Escape Regular Expression Characters
|--------------------------------------------------------------------------
*/

const escapeRegex = (text = "") => {
    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

/*
|--------------------------------------------------------------------------
| Create Mention Notifications
|--------------------------------------------------------------------------
*/

const createMentionNotifications =
    async ({
        text = "",
        senderId,
        postId,
    }) => {
        if (
            !text?.trim() ||
            !senderId
        ) {
            return;
        }

        const users =
            await user
                .find({
                    name: {
                        $exists: true,
                        $ne: "",
                    },
                })
                .select(
                    "_id name"
                );

        if (
            !users.length
        ) {
            return;
        }

        for (
            const mentionedUser of users
        ) {
            const userName =
                mentionedUser.name?.trim();

            if (!userName) {
                continue;
            }

            const escapedName =
                escapeRegex(
                    userName
                );

            const mentionRegex =
                new RegExp(
                    `@${escapedName}(?![a-zA-Z0-9_])`,
                    "i"
                );

            if (
                !mentionRegex.test(
                    text
                )
            ) {
                continue;
            }

            await createNotification({
                recipientId:
                    mentionedUser._id,
                senderId,
                type: "mention",
                postId,
                message:
                    "mentioned you.",
            });

            console.log(
                "MENTION NOTIFICATION CREATED:",
                mentionedUser.name
            );
        }
    };

/*
|--------------------------------------------------------------------------
| Create Post
|--------------------------------------------------------------------------
*/

export const createPost =
    async (req, res) => {
        try {
            const userId =
                req.user.userId;

            const {
                content,
                postType,
                imageUrl,
                codeSnippet,
                projectUrl,
                hashtags,
            } = req.body;

            if (
                !content?.trim() &&
                !imageUrl &&
                !codeSnippet?.trim() &&
                !projectUrl?.trim()
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Post content cannot be empty.",
                    });
            }

            const combinedText = [
                content || "",
                ...(hashtags || []),
            ].join(" ");

            const extractedHashtags =
                extractHashtags(
                    combinedText
                );

            const manualHashtags =
                Array.isArray(
                    hashtags
                )
                    ? hashtags
                          .map((tag) =>
                              String(tag)
                                  .replace(
                                      /^#/,
                                      ""
                                  )
                                  .trim()
                                  .toLowerCase()
                          )
                          .filter(Boolean)
                    : [];

            const finalHashtags = [
                ...new Set([
                    ...extractedHashtags,
                    ...manualHashtags,
                ]),
            ];

            const post =
                await Post.create({
                    userId,
                    content:
                        content || "",
                    postType:
                        postType ||
                        "update",
                    imageUrl:
                        imageUrl || "",
                    codeSnippet:
                        codeSnippet ||
                        "",
                    projectUrl:
                        projectUrl ||
                        "",
                    hashtags:
                        finalHashtags,
                });

            await createMentionNotifications({
                text:
                    content || "",
                senderId:
                    userId,
                postId:
                    post._id,
            });

            const populatedPost =
                await Post.findById(
                    post._id
                ).populate(
                    "userId",
                    "name email"
                );

            return res
                .status(201)
                .json({
                    data:
                        populatedPost,
                    message:
                        "Post created successfully.",
                });
        } catch (error) {
            console.error(
                "Create post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while creating the post.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Get Community Feed
|--------------------------------------------------------------------------
*/

export const getFeed =
    async (req, res) => {
        try {
            const page =
                Math.max(
                    Number(
                        req.query.page
                    ) || 1,
                    1
                );

            const limit =
                Math.min(
                    Math.max(
                        Number(
                            req.query.limit
                        ) || 10,
                        1
                    ),
                    50
                );

            const skip =
                (page - 1) * limit;

            const hashtag =
                typeof req.query
                    .hashtag ===
                "string"
                    ? req.query.hashtag
                          .replace(
                              /^#/,
                              ""
                          )
                          .trim()
                          .toLowerCase()
                    : "";

            const query = {
                status: "active",
            };

            if (hashtag) {
                query.hashtags =
                    hashtag;
            }

            const [
                posts,
                total,
            ] =
                await Promise.all([
                    Post.find(query)
                        .populate(
                            "userId",
                            "name email reputation"
                        )
                        .sort({
                            createdAt:
                                -1,
                        })
                        .skip(skip)
                        .limit(
                            limit
                        ),

                    Post.countDocuments(
                        query
                    ),
                ]);

            return res
                .status(200)
                .json({
                    data: posts,

                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages:
                            Math.ceil(
                                total /
                                    limit
                            ),
                        hasMore:
                            skip +
                                posts.length <
                            total,
                    },
                });
        } catch (error) {
            console.error(
                "Get feed error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while loading the community feed.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Get Trending Posts
|--------------------------------------------------------------------------
*/

export const getTrendingPosts =
    async (req, res) => {
        try {
            const page =
                Math.max(
                    Number(
                        req.query.page
                    ) || 1,
                    1
                );

            const limit =
                Math.min(
                    Math.max(
                        Number(
                            req.query.limit
                        ) || 10,
                        1
                    ),
                    50
                );

            const skip =
                (page - 1) * limit;

            const posts =
                await Post.aggregate([
                    {
                        $match: {
                            status: "active",
                        },
                    },

                    {
                        $addFields: {
                            engagementScore:
                                {
                                    $add: [
                                        {
                                            $multiply:
                                                [
                                                    {
                                                        $size: {
                                                            $ifNull:
                                                                [
                                                                    "$likes",
                                                                    [],
                                                                ],
                                                        },
                                                    },
                                                    3,
                                                ],
                                        },

                                        {
                                            $multiply:
                                                [
                                                    {
                                                        $size: {
                                                            $ifNull:
                                                                [
                                                                    "$comments",
                                                                    [],
                                                                ],
                                                        },
                                                    },
                                                    4,
                                                ],
                                        },

                                        {
                                            $multiply:
                                                [
                                                    {
                                                        $size: {
                                                            $ifNull:
                                                                [
                                                                    "$shares",
                                                                    [],
                                                                ],
                                                        },
                                                    },
                                                    5,
                                                ],
                                        },

                                        {
                                            $multiply:
                                                [
                                                    {
                                                        $size: {
                                                            $ifNull:
                                                                [
                                                                    "$bookmarks",
                                                                    [],
                                                                ],
                                                        },
                                                    },
                                                    2,
                                                ],
                                        },
                                    ],
                                },
                        },
                    },

                    {
                        $sort: {
                            engagementScore:
                                -1,
                            createdAt:
                                -1,
                        },
                    },

                    {
                        $skip: skip,
                    },

                    {
                        $limit: limit,
                    },
                ]);

            await Post.populate(
                posts,
                {
                    path: "userId",
                    select:
                        "name email reputation",
                }
            );

            return res
                .status(200)
                .json({
                    data: posts,
                    page,
                    limit,
                });
        } catch (error) {
            console.error(
                "Trending posts error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while loading trending posts.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Get Single Post
|--------------------------------------------------------------------------
*/

export const getPost =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid post.",
                    });
            }

            const post =
                await Post.findOne({
                    _id: id,
                    status: "active",
                })
                    .populate(
                        "userId",
                        "name email reputation"
                    )
                    .populate(
                        "comments.userId",
                        "name email"
                    );

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            return res
                .status(200)
                .json({
                    data: post,
                });
        } catch (error) {
            console.error(
                "Get post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Edit Own Post
|--------------------------------------------------------------------------
*/

export const editPost =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const userId =
                req.user.userId;

            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid post.",
                    });
            }

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            if (
                post.userId.toString() !==
                userId.toString()
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "You can only edit your own posts.",
                    });
            }

            const {
                content,
                postType,
                imageUrl,
                codeSnippet,
                projectUrl,
                hashtags,
            } = req.body;

            const combinedText = [
                content || "",
                ...(hashtags || []),
            ].join(" ");

            const extractedHashtags =
                extractHashtags(
                    combinedText
                );

            const manualHashtags =
                Array.isArray(
                    hashtags
                )
                    ? hashtags
                          .map((tag) =>
                              String(tag)
                                  .replace(
                                      /^#/,
                                      ""
                                  )
                                  .trim()
                                  .toLowerCase()
                          )
                          .filter(Boolean)
                    : [];

            post.content =
                content ??
                post.content;

            post.postType =
                postType ??
                post.postType;

            post.imageUrl =
                imageUrl ??
                post.imageUrl;

            post.codeSnippet =
                codeSnippet ??
                post.codeSnippet;

            post.projectUrl =
                projectUrl ??
                post.projectUrl;

            post.hashtags = [
                ...new Set([
                    ...extractedHashtags,
                    ...manualHashtags,
                ]),
            ];

            post.updatedAt =
                new Date();

            await post.save();

            const populatedPost =
                await Post.findById(
                    post._id
                ).populate(
                    "userId",
                    "name email"
                );

            return res
                .status(200)
                .json({
                    data:
                        populatedPost,
                    message:
                        "Post updated successfully.",
                });
        } catch (error) {
            console.error(
                "Edit post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while editing the post.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Delete Own Post
|--------------------------------------------------------------------------
*/

export const deletePost =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const userId =
                req.user.userId;

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            if (
                post.userId.toString() !==
                userId.toString()
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "You can only delete your own posts.",
                    });
            }

            await Post.findByIdAndDelete(
                id
            );

            return res
                .status(200)
                .json({
                    message:
                        "Post deleted successfully.",
                });
        } catch (error) {
            console.error(
                "Delete post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while deleting the post.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Like / Unlike
|--------------------------------------------------------------------------
*/

export const toggleLike =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const userId =
                req.user.userId;

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            const index =
                post.likes.findIndex(
                    (id) =>
                        id.toString() ===
                        userId.toString()
                );

            if (index >= 0) {
                post.likes.splice(
                    index,
                    1
                );
            } else {
                post.likes.push(
                    userId
                );

                await createNotification({
                    recipientId:
                        post.userId,
                    senderId:
                        userId,
                    type: "like",
                    postId:
                        post._id,
                    message:
                        "liked your post.",
                });
            }

            await post.save();

            return res
                .status(200)
                .json({
                    data: {
                        liked:
                            index < 0,
                        likes:
                            post.likes
                                .length,
                    },
                    message:
                        index < 0
                            ? "Post liked."
                            : "Like removed.",
                });
        } catch (error) {
            console.error(
                "Like post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Add Comment
|--------------------------------------------------------------------------
*/

export const addComment =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const userId =
                req.user.userId;

            const {
                body,
                parentCommentId,
            } = req.body;

            if (!body?.trim()) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Comment cannot be empty.",
                    });
            }

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            const comment = {
                userId,
                body: body.trim(),
                parentCommentId:
                    parentCommentId ||
                    null,
            };

            post.comments.push(
                comment
            );

            await post.save();

            await createMentionNotifications({
                text:
                    body.trim(),
                senderId:
                    userId,
                postId:
                    post._id,
            });

            await createNotification({
                recipientId:
                    post.userId,
                senderId:
                    userId,
                type:
                    parentCommentId
                        ? "reply"
                        : "comment",
                postId:
                    post._id,
                message:
                    parentCommentId
                        ? "replied to your comment."
                        : "commented on your post.",
            });

            const populatedPost =
                await Post.findById(
                    post._id
                )
                    .populate(
                        "userId",
                        "name email"
                    )
                    .populate(
                        "comments.userId",
                        "name email"
                    );

            return res
                .status(201)
                .json({
                    data:
                        populatedPost,
                    message:
                        "Comment added successfully.",
                });
        } catch (error) {
            console.error(
                "Add comment error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while adding the comment.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Delete Own Comment
|--------------------------------------------------------------------------
*/

export const deleteComment =
    async (req, res) => {
        try {
            const {
                id,
                commentId,
            } = req.params;

            const userId =
                req.user.userId;

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            const comment =
                post.comments.id(
                    commentId
                );

            if (!comment) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Comment not found.",
                    });
            }

            if (
                comment.userId.toString() !==
                userId.toString()
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "You can only delete your own comments.",
                    });
            }

            comment.deleteOne();

            await post.save();

            return res
                .status(200)
                .json({
                    message:
                        "Comment deleted successfully.",
                });
        } catch (error) {
            console.error(
                "Delete comment error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Share Post
|--------------------------------------------------------------------------
*/

export const sharePost =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const userId =
                req.user.userId;

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            const alreadyShared =
                post.shares.some(
                    (id) =>
                        id.toString() ===
                        userId.toString()
                );

            if (!alreadyShared) {
                post.shares.push(
                    userId
                );

                await post.save();

                await createNotification({
                    recipientId:
                        post.userId,
                    senderId:
                        userId,
                    type: "share",
                    postId:
                        post._id,
                    message:
                        "shared your post.",
                });
            }

            return res
                .status(200)
                .json({
                    data: {
                        shared: true,
                        shares:
                            post.shares
                                .length,
                    },
                    message:
                        "Post shared successfully.",
                });
        } catch (error) {
            console.error(
                "Share post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Bookmark / Remove Bookmark
|--------------------------------------------------------------------------
*/

export const toggleBookmark =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const userId =
                req.user.userId;

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            const index =
                post.bookmarks.findIndex(
                    (id) =>
                        id.toString() ===
                        userId.toString()
                );

            if (index >= 0) {
                post.bookmarks.splice(
                    index,
                    1
                );
            } else {
                post.bookmarks.push(
                    userId
                );
            }

            await post.save();

            return res
                .status(200)
                .json({
                    data: {
                        bookmarked:
                            index < 0,
                        bookmarks:
                            post.bookmarks
                                .length,
                    },
                    message:
                        index < 0
                            ? "Post bookmarked."
                            : "Bookmark removed.",
                });
        } catch (error) {
            console.error(
                "Bookmark post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Report Post
|--------------------------------------------------------------------------
*/

export const reportPost =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const userId =
                req.user.userId;

            const { reason } =
                req.body;

            if (!reason?.trim()) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Report reason is required.",
                    });
            }

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            if (
                post.status ===
                "removed"
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "This post has already been removed.",
                    });
            }

            const alreadyReported =
                post.reports.some(
                    (report) =>
                        report.userId.toString() ===
                        userId.toString()
                );

            if (alreadyReported) {
                return res
                    .status(400)
                    .json({
                        message:
                            "You have already reported this post.",
                    });
            }

            post.reports.push({
                userId,
                reason:
                    reason.trim(),
            });

            if (
                post.reports.length >=
                3
            ) {
                post.status =
                    "under_review";
            }

            await post.save();

            return res
                .status(200)
                .json({
                    data: {
                        reportCount:
                            post.reports
                                .length,
                        status:
                            post.status,
                    },
                    message:
                        "Post reported successfully.",
                });
        } catch (error) {
            console.error(
                "Report post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while reporting the post.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Get Notifications
|--------------------------------------------------------------------------
*/

export const getNotifications =
    async (req, res) => {
        try {
            const userId =
                req.user.userId;

            const notifications =
                await Notification.find({
                    recipientId:
                        userId,
                })
                    .populate(
                        "senderId",
                        "name email"
                    )
                    .populate(
                        "postId",
                        "content postType"
                    )
                    .sort({
                        createdAt:
                            -1,
                    })
                    .limit(50);

            return res
                .status(200)
                .json({
                    data:
                        notifications,
                });
        } catch (error) {
            console.error(
                "Get notifications error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Mark Notifications As Read
|--------------------------------------------------------------------------
*/

export const markNotificationsRead =
    async (req, res) => {
        try {
            const userId =
                req.user.userId;

            await Notification.updateMany(
                {
                    recipientId:
                        userId,
                    read: false,
                },
                {
                    $set: {
                        read: true,
                    },
                }
            );

            return res
                .status(200)
                .json({
                    message:
                        "Notifications marked as read.",
                });
        } catch (error) {
            console.error(
                "Mark notifications read error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Admin: Get Reported Posts
|--------------------------------------------------------------------------
*/

export const getAdminReports =
    async (req, res) => {
        try {
            const posts =
                await Post.find({
                    status:
                        "under_review",
                    "reports.0":
                        {
                            $exists: true,
                        },
                })
                    .populate(
                        "userId",
                        "name email reputation suspended suspensionReason"
                    )
                    .populate(
                        "reports.userId",
                        "name email"
                    )
                    .sort({
                        updatedAt:
                            -1,
                    });

            return res
                .status(200)
                .json({
                    data: posts,
                    count:
                        posts.length,
                });
        } catch (error) {
            console.error(
                "Get admin reports error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while loading reports.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Admin: Remove Post
|--------------------------------------------------------------------------
*/

export const adminRemovePost =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const post =
                await Post.findById(id);

            if (!post) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Post not found.",
                    });
            }

            post.status =
                "removed";

            await post.save();

            /*
            |--------------------------------------------------------------------------
            | Notify Post Owner
            |--------------------------------------------------------------------------
            */

            await Notification.create({
                recipientId:
                    post.userId,
                senderId:
                    req.user.userId,
                type: "admin",
                postId:
                    post._id,
                message:
                    "Your post was removed by an administrator.",
            });

            return res
                .status(200)
                .json({
                    message:
                        "Post removed by administrator.",
                });
        } catch (error) {
            console.error(
                "Admin remove post error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong.",
                });
        }
    };

/*
|--------------------------------------------------------------------------
| Admin: Suspend User
|--------------------------------------------------------------------------
*/

export const adminSuspendUser =
    async (req, res) => {
        try {
            const {
                userId,
            } = req.params;

            const {
                reason,
            } = req.body;

            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid user.",
                    });
            }

            const targetUser =
                await user.findById(
                    userId
                );

            if (!targetUser) {
                return res
                    .status(404)
                    .json({
                        message:
                            "User not found.",
                    });
            }

            if (
                targetUser.role ===
                "admin"
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "Administrators cannot be suspended through this endpoint.",
                    });
            }

            targetUser.suspended =
                true;

            targetUser.suspensionReason =
                reason?.trim() ||
                "Repeated community violations.";

            await targetUser.save();

            await Notification.create({
                recipientId:
                    targetUser._id,
                senderId:
                    req.user.userId,
                type: "admin",
                postId: null,
                message:
                    "Your account has been suspended by an administrator.",
            });

            return res
                .status(200)
                .json({
                    data: {
                        userId:
                            targetUser._id,
                        suspended:
                            true,
                        reason:
                            targetUser.suspensionReason,
                    },
                    message:
                        "User suspended successfully.",
                });
        } catch (error) {
            console.error(
                "Admin suspend user error:",
                error
            );

            return res
                .status(500)
                .json({
                    message:
                        "Something went wrong while suspending the user.",
                });
        }
    };