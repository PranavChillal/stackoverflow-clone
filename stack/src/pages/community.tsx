"use client";

import React, { useCallback, useEffect, useState } from "react";
import MainLayout from "@/layout/MainLayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  TrendingUp,
  Image as ImageIcon,
  Code2,
  Award,
  FolderGit2,
  Loader2,
  Trash2,
  Pencil,
  Flag,
} from "lucide-react";

type PostType = "update" | "image" | "code" | "project" | "achievement";

type PostUser = {
  _id?: string;
  id?: string;
  userId?: string;
  name: string;
  email?: string;
  reputation?: number;
};

type Comment = {
  _id: string;
  userId: PostUser | string;
  body: string;
  parentCommentId?: string | null;
  createdAt: string;
};

type Post = {
  _id: string;
  userId: PostUser | string;
  content: string;
  postType: PostType;
  imageUrl?: string;
  codeSnippet?: string;
  projectUrl?: string;
  hashtags: string[];
  likes: string[];
  shares: string[];
  bookmarks: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
};

const CommunityPage = () => {
  const auth = useAuth() as any;
  const currentUser = auth?.user || null;

  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;
  const t = (translations[languageKey] || translations.english) as any;

  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);

  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [feedMode, setFeedMode] = useState<"all" | "following" | "trending">(
    "all",
  );

  const [followingLoading, setFollowingLoading] = useState(false);

  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("update");

  const [imageUrl, setImageUrl] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

  const [expandedComments, setExpandedComments] = useState<string | null>(null);

  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>(
    {},
  );

  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const [showTrending, setShowTrending] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  /*
   |--------------------------------------------------------------------------
   | Get ID From Any User/Object
   |--------------------------------------------------------------------------
   */

  const getId = (value: any): string | null => {
    if (!value) {
      return null;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      const id = value._id || value.id || value.userId;

      if (id) {
        return String(id);
      }
    }

    return null;
  };

  /*
   |--------------------------------------------------------------------------
   | Get Current User ID
   |--------------------------------------------------------------------------
   */

  const getCurrentUserId = () => {
    const authUserId = getId(currentUser);

    if (authUserId) {
      return authUserId;
    }

    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = localStorage.getItem("user");

      if (!stored) {
        return null;
      }

      const user = JSON.parse(stored);

      return getId(user);
    } catch {
      return null;
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Get Post User ID
   |--------------------------------------------------------------------------
   */

  const getPostUserId = (post: Post) => {
    if (!post?.userId) {
      return null;
    }

    return getId(post.userId);
  };

  /*
   |--------------------------------------------------------------------------
   | Check Own Post
   |--------------------------------------------------------------------------
   */

  const isOwnPost = (post: Post) => {
    const currentUserId = getCurrentUserId();
    const postUserId = getPostUserId(post);

    if (!currentUserId || !postUserId) {
      return false;
    }

    return String(currentUserId) === String(postUserId);
  };

  /*
   |--------------------------------------------------------------------------
   | Load Following IDs
   |--------------------------------------------------------------------------
   */

  const loadFollowingIds = useCallback(async () => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      setFollowingIds([]);
      return [];
    }

    try {
      setFollowingLoading(true);

      const response = await axiosInstance.get("/follow/following");

      const users = response.data?.data || [];

      const ids = users
        .map((followingUser: any) => getId(followingUser))
        .filter(Boolean) as string[];

      setFollowingIds(ids);

      return ids;
    } catch (error) {
      console.error("Following users loading error:", error);

      setFollowingIds([]);

      return [];
    } finally {
      setFollowingLoading(false);
    }
  }, [currentUser]);

  /*
   |--------------------------------------------------------------------------
   | Load Feed
   |--------------------------------------------------------------------------
   */

  const loadFeed = useCallback(
    async (pageNumber = 1, append = false, explicitFollowingIds?: string[]) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await axiosInstance.get("/post/feed", {
          params: {
            page: pageNumber,
            limit: 10,
            ...(selectedHashtag
              ? {
                  hashtag: selectedHashtag,
                }
              : {}),
          },
        });

        let newPosts: Post[] = response.data?.data || [];

        const pagination = response.data?.pagination;

        if (feedMode === "following") {
          const ids = explicitFollowingIds || [];

          newPosts = newPosts.filter((post) => {
            const postUserId = getPostUserId(post);

            return (
              postUserId !== null &&
              ids.some((id) => String(id) === String(postUserId))
            );
          });
        }

        setPosts((currentPosts) => {
          if (!append) {
            return newPosts;
          }

          const existingIds = new Set(currentPosts.map((post) => post._id));

          const uniquePosts = newPosts.filter(
            (post) => !existingIds.has(post._id),
          );

          return [...currentPosts, ...uniquePosts];
        });

        setPage(pageNumber);
        setHasMore(Boolean(pagination?.hasMore));
      } catch (error) {
        console.error("Feed loading error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [feedMode, selectedHashtag],
  );

  /*
   |--------------------------------------------------------------------------
   | Load Trending
   |--------------------------------------------------------------------------
   */

  const loadTrending = async () => {
    try {
      const response = await axiosInstance.get("/post/trending", {
        params: {
          page: 1,
          limit: 5,
        },
      });

      setTrendingPosts(response.data?.data || []);
      setShowTrending(true);
    } catch (error) {
      console.error("Trending error:", error);
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Initial Feed
   |--------------------------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadCurrentFeed = async () => {
      if (feedMode === "following") {
        setLoading(true);
        setPage(1);
        setHasMore(true);

        const ids = await loadFollowingIds();

        if (cancelled) {
          return;
        }

        if (!ids || ids.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          return;
        }

        await loadFeed(1, false, ids);

        return;
      }

      await loadFeed(1, false);
    };

    loadCurrentFeed();

    return () => {
      cancelled = true;
    };
  }, [feedMode, selectedHashtag, loadFeed, loadFollowingIds]);

  /*
   |--------------------------------------------------------------------------
   | Infinite Scroll
   |--------------------------------------------------------------------------
   */

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500;

      if (
        nearBottom &&
        hasMore &&
        !loadingMore &&
        !loading &&
        feedMode !== "trending"
      ) {
        if (feedMode === "following") {
          loadFollowingIds().then((ids) => {
            if (ids.length > 0) {
              loadFeed(page + 1, true, ids);
            }
          });
        } else {
          loadFeed(page + 1, true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [page, hasMore, loadingMore, loading, loadFeed]);

  const postTypeLabels: Record<PostType, string> = {
    update: t.postTypeUpdate || "Update",
    image: t.postTypeImage || "Image",
    code: t.postTypeCode || "Code",
    project: t.postTypeProject || "Project",
    achievement: t.postTypeAchievement || "Achievement",
  };

  /*
   |--------------------------------------------------------------------------
   | Create Post
   |--------------------------------------------------------------------------
   */

  const createPost = async () => {
    const hasContent =
      content.trim() ||
      imageUrl.trim() ||
      codeSnippet.trim() ||
      projectUrl.trim();

    if (!hasContent) {
      alert(t.addSomethingToPost || "Please add something to your post.");
      return;
    }

    try {
      setCreatingPost(true);

      const response = await axiosInstance.post("/post", {
        content: content.trim(),
        postType,
        imageUrl: imageUrl.trim(),
        codeSnippet: codeSnippet.trim(),
        projectUrl: projectUrl.trim(),
      });

      const newPost = response.data?.data;

      if (newPost) {
        setPosts((currentPosts) => [newPost, ...currentPosts]);
      }

      setContent("");
      setImageUrl("");
      setCodeSnippet("");
      setProjectUrl("");
      setPostType("update");
    } catch (error: any) {
      console.error("Create post error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToCreatePost ||
          "Unable to create post.",
      );
    } finally {
      setCreatingPost(false);
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Like
   |--------------------------------------------------------------------------
   */

  const toggleLike = async (postId: string) => {
    try {
      const response = await axiosInstance.patch(`/post/${postId}/like`);

      const liked = Boolean(response.data?.data?.liked);

      const userId = getCurrentUserId();

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post._id !== postId) {
            return post;
          }

          let updatedLikes = [...(post.likes || [])];

          if (
            userId &&
            liked &&
            !updatedLikes.some((id) => String(id) === String(userId))
          ) {
            updatedLikes.push(userId);
          }

          if (userId && !liked) {
            updatedLikes = updatedLikes.filter(
              (id) => String(id) !== String(userId),
            );
          }

          return {
            ...post,
            likes: updatedLikes,
          };
        }),
      );
    } catch (error: any) {
      console.error("Like error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToLikePost ||
          "Unable to like post.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Bookmark
   |--------------------------------------------------------------------------
   */

  const toggleBookmark = async (postId: string) => {
    try {
      const response = await axiosInstance.patch(`/post/${postId}/bookmark`);

      const bookmarked = Boolean(response.data?.data?.bookmarked);

      const userId = getCurrentUserId();

      if (!userId) {
        return;
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post._id !== postId) {
            return post;
          }

          let updatedBookmarks = [...(post.bookmarks || [])];

          if (
            bookmarked &&
            !updatedBookmarks.some((id) => String(id) === String(userId))
          ) {
            updatedBookmarks.push(userId);
          }

          if (!bookmarked) {
            updatedBookmarks = updatedBookmarks.filter(
              (id) => String(id) !== String(userId),
            );
          }

          return {
            ...post,
            bookmarks: updatedBookmarks,
          };
        }),
      );
    } catch (error: any) {
      console.error("Bookmark error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToBookmarkPost ||
          "Unable to bookmark post.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Share
   |--------------------------------------------------------------------------
   */

  const sharePost = async (postId: string) => {
    try {
      await axiosInstance.post(`/post/${postId}/share`);

      const shareUrl =
        `${window.location.origin}` + `/community?post=${postId}`;

      await navigator.clipboard.writeText(shareUrl);

      alert(t.postLinkCopied || "Post link copied!");

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                shares: [...(post.shares || []), "shared"],
              }
            : post,
        ),
      );
    } catch (error: any) {
      console.error("Share error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToSharePost ||
          "Unable to share post.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Comment
   |--------------------------------------------------------------------------
   */

  const addComment = async (
    postId: string,
    parentCommentId: string | null = null,
  ) => {
    const text = parentCommentId
      ? replyText[parentCommentId]?.trim()
      : commentText[postId]?.trim();

    if (!text) {
      return;
    }

    try {
      const response = await axiosInstance.post(`/post/${postId}/comment`, {
        body: text,
        ...(parentCommentId ? { parentCommentId } : {}),
      });

      const updatedPost = response.data?.data;

      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post._id === postId ? updatedPost : post,
          ),
        );
      }

      if (parentCommentId) {
        setReplyText((current) => ({
          ...current,
          [parentCommentId]: "",
        }));

        setReplyTarget((current) => ({
          ...current,
          [postId]: null,
        }));
      } else {
        setCommentText((current) => ({
          ...current,
          [postId]: "",
        }));
      }
    } catch (error: any) {
      console.error("Comment error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToAddComment ||
          "Unable to add comment.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Delete Own Comment
   |--------------------------------------------------------------------------
   */

  const deleteComment = async (postId: string, commentId: string) => {
    const confirmed = window.confirm(
      t.confirmDeleteComment || "Are you sure you want to delete this comment?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await axiosInstance.delete(
        `/post/${postId}/comment/${commentId}`,
      );

      const updatedPost = response.data?.data;

      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post._id === postId ? updatedPost : post,
          ),
        );
      } else {
        await loadFeed(1, false);
      }
    } catch (error: any) {
      console.error("Delete comment error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToDeleteComment ||
          "Unable to delete comment.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Delete Post
   |--------------------------------------------------------------------------
   */

  const deletePost = async (postId: string) => {
    const confirmed = window.confirm(
      t.confirmDeletePost || "Are you sure you want to delete this post?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.delete(`/post/${postId}`);

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post._id !== postId),
      );

      setOpenMenu(null);
    } catch (error: any) {
      console.error("Delete error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToDeletePost ||
          "Unable to delete post.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Edit Post
   |--------------------------------------------------------------------------
   */

  const startEditing = (post: Post) => {
    setEditingPost(post._id);
    setEditContent(post.content);
    setOpenMenu(null);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditContent("");
  };

  const saveEdit = async (postId: string) => {
    if (!editContent.trim()) {
      alert(t.postContentCannotBeEmpty || "Post content cannot be empty.");
      return;
    }

    try {
      const response = await axiosInstance.patch(`/post/${postId}`, {
        content: editContent.trim(),
      });

      const updatedPost = response.data?.data;

      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post._id === postId ? updatedPost : post,
          ),
        );
      } else {
        await loadFeed(1, false);
      }

      cancelEditing();
    } catch (error: any) {
      console.error("Edit error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToEditPost ||
          "Unable to edit post.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Report Post
   |--------------------------------------------------------------------------
   */

  const reportPost = async (postId: string) => {
    const reason = window.prompt(
      t.reportReason || "Why are you reporting this post?",
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      await axiosInstance.post(`/post/${postId}/report`, {
        reason: reason.trim(),
      });

      alert(t.postReportedSuccessfully || "Post reported successfully.");

      setOpenMenu(null);
    } catch (error: any) {
      console.error("Report error:", error);

      alert(
        error.response?.data?.message ||
          t.unableToReportPost ||
          "Unable to report post.",
      );
    }
  };

  /*
   |--------------------------------------------------------------------------
   | Hashtag Filter
   |--------------------------------------------------------------------------
   */

  const selectHashtag = (hashtag: string) => {
    const cleanHashtag = hashtag.replace(/^#/, "").trim().toLowerCase();

    if (!cleanHashtag) {
      return;
    }

    setFeedMode("all");
    setSelectedHashtag(cleanHashtag);
    setPage(1);
    setHasMore(true);
    setShowTrending(false);
  };

  const clearHashtagFilter = () => {
    setSelectedHashtag(null);
    setFeedMode("all");
    setPage(1);
    setHasMore(true);
    setShowTrending(false);
  };

  /*
   |--------------------------------------------------------------------------
   | Helpers
   |--------------------------------------------------------------------------
   */

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isLiked = (post: Post) => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      return false;
    }

    return (
      post.likes?.some((id) => String(id) === String(currentUserId)) || false
    );
  };

  const isBookmarked = (post: Post) => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      return false;
    }

    return (
      post.bookmarks?.some((id) => String(id) === String(currentUserId)) ||
      false
    );
  };

  const getCommentUserName = (comment: Comment) => {
    if (typeof comment.userId === "object") {
      return comment.userId.name || t.user || "User";
    }

    return t.user || "User";
  };

  const getCommentInitial = (comment: Comment) => {
    return getCommentUserName(comment).charAt(0).toUpperCase();
  };

  const getCommentUserId = (comment: Comment) => {
    return getId(comment.userId);
  };

  const isOwnComment = (comment: Comment) => {
    const currentUserId = getCurrentUserId();

    const commentUserId = getCommentUserId(comment);

    return Boolean(
      currentUserId &&
      commentUserId &&
      String(currentUserId) === String(commentUserId),
    );
  };

  const renderComment = (post: Post, comment: Comment, isReply = false) => {
    const children = (post.comments || []).filter(
      (child) => String(child.parentCommentId || "") === String(comment._id),
    );

    return (
      <div key={comment._id} className={isReply ? "ml-6 sm:ml-10" : ""}>
        <div className="flex min-w-0 gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            {getCommentInitial(comment)}
          </div>

          <div className="min-w-0 flex-1 rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <p className="min-w-0 break-words text-sm font-semibold text-gray-900">
                {getCommentUserName(comment)}
              </p>

              {isOwnComment(comment) && (
                <button
                  type="button"
                  onClick={() => deleteComment(post._id, comment._id)}
                  className="shrink-0 px-1 py-1 text-xs text-red-600 hover:text-red-700"
                >
                  {t.delete || "Delete"}
                </button>
              )}
            </div>

            <p className="mt-1 break-words whitespace-pre-wrap text-sm leading-5 text-gray-700">
              {comment.body}
            </p>

            {!isReply && (
              <button
                type="button"
                onClick={() =>
                  setReplyTarget((current) => ({
                    ...current,
                    [post._id]:
                      current[post._id] === comment._id ? null : comment._id,
                  }))
                }
                className="mt-2 min-h-9 px-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {replyTarget[post._id] === comment._id
                  ? "Cancel reply"
                  : "Reply"}
              </button>
            )}
          </div>
        </div>

        {replyTarget[post._id] === comment._id && (
          <div className="ml-10 mt-2 flex min-w-0 gap-2 sm:ml-10">
            <input
              value={replyText[comment._id] || ""}
              onChange={(e) =>
                setReplyText((current) => ({
                  ...current,
                  [comment._id]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addComment(post._id, comment._id);
                }
              }}
              placeholder={t.writeReply || "Write a reply..."}
              className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <button
              type="button"
              onClick={() => addComment(post._id, comment._id)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}

        {children.length > 0 && (
          <div className="mt-3 space-y-3">
            {children.map((child) => renderComment(post, child, true))}
          </div>
        )}
      </div>
    );
  };

  /*
   |--------------------------------------------------------------------------
   | Render
   |--------------------------------------------------------------------------
   */

  return (
    <MainLayout>
      <div
        className="mx-auto w-full max-w-7xl min-w-0 px-2 py-4 sm:px-4 sm:py-6"
        onClick={() => {
          if (openMenu) {
            setOpenMenu(null);
          }
        }}
      >
        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
              {t.community || "Community"}
            </h1>

            <p className="mt-1 break-words text-sm leading-5 text-gray-600">
              {t.communityDescription ||
                "Share, learn and connect with the CodeQuest community."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => {
                setSelectedHashtag(null);
                setFeedMode("all");
                setPage(1);
                setHasMore(true);
                setShowTrending(false);
              }}
              className={`min-h-10 rounded-md border px-3 py-2 text-sm font-medium sm:px-4 ${
                feedMode === "all" && !selectedHashtag
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.allPosts || "All Posts"}
            </button>

            <button
              type="button"
              disabled={followingLoading}
              onClick={() => {
                setSelectedHashtag(null);
                setFeedMode("following");
                setPage(1);
                setHasMore(true);
                setShowTrending(false);
              }}
              className={`min-h-10 rounded-md border px-3 py-2 text-sm font-medium sm:px-4 ${
                feedMode === "following"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              } disabled:opacity-60`}
            >
              {t.following || "Following"}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                setSelectedHashtag(null);
                setFeedMode("trending");
                setPage(1);
                setHasMore(false);
                loadTrending();
              }}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium sm:px-4 ${
                feedMode === "trending"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              {t.trending || "Trending"}
            </button>
          </div>
        </div>

        {/* Hashtag Filter */}
        {selectedHashtag && (
          <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="break-words text-sm text-gray-600">
              {t.showingPostsFor || "Showing posts for"}
            </span>

            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <span className="break-all">#{selectedHashtag}</span>

              <button
                type="button"
                onClick={clearHashtagFilter}
                className="shrink-0 px-1 text-blue-500 hover:text-blue-800"
                aria-label={t.clearHashtagFilter || "Clear hashtag filter"}
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main */}
          <div className="min-w-0">
            {/* Create Post */}
            <div className="mb-5 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-5">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {t.createPost || "Create a post"}
              </h2>

              <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {[
                  {
                    type: "update" as PostType,
                    label: postTypeLabels.update,
                    icon: MessageCircle,
                  },
                  {
                    type: "image" as PostType,
                    label: postTypeLabels.image,
                    icon: ImageIcon,
                  },
                  {
                    type: "code" as PostType,
                    label: postTypeLabels.code,
                    icon: Code2,
                  },
                  {
                    type: "project" as PostType,
                    label: postTypeLabels.project,
                    icon: FolderGit2,
                  },
                  {
                    type: "achievement" as PostType,
                    label: postTypeLabels.achievement,
                    icon: Award,
                  },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-2 py-2 text-sm sm:h-9 sm:min-h-0 sm:px-3 ${
                      postType === type
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  t.postContentPlaceholder ||
                  "What are you working on or learning?"
                }
                rows={4}
                className="min-h-28 w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-3 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              {postType === "image" && (
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t.imageUrl || "Image URL"}
                  className="mt-3 h-11 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
              )}

              {postType === "code" && (
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder={t.pasteCode || "Paste your code here..."}
                  rows={8}
                  className="mt-3 min-h-48 w-full resize-none overflow-x-auto rounded-md border border-gray-300 bg-gray-950 px-3 py-3 font-mono text-sm text-green-400 outline-none"
                />
              )}

              {postType === "project" && (
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder={t.projectUrl || "Project URL"}
                  className="mt-3 h-11 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
              )}

              <div className="mt-4 flex justify-stretch sm:justify-end">
                <button
                  type="button"
                  onClick={createPost}
                  disabled={creatingPost}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                >
                  {creatingPost ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.posting || "Posting..."}
                    </>
                  ) : (
                    t.post || "Post"
                  )}
                </button>
              </div>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center sm:p-10">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.noPostsYet || "No posts yet"}
                </h3>

                <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                  {selectedHashtag
                    ? `${t.noPostsFoundFor || "No posts found for"} #${selectedHashtag}.`
                    : feedMode === "following"
                      ? t.followingEmpty ||
                        "People you follow haven't shared anything on this page yet."
                      : t.beFirstToShare ||
                        "Be the first person to share something with the community."}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map((post) => (
                  <article
                    key={post._id}
                    className="overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    {/* Header */}
                    <div className="p-3 pb-3 sm:p-5 sm:pb-3">
                      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 sm:h-11 sm:w-11">
                            {typeof post.userId === "object"
                              ? post.userId.name
                                  ?.split(" ")
                                  .map((name) => name.charAt(0))
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "U"}
                          </div>

                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-gray-900 sm:text-base">
                              {typeof post.userId === "object"
                                ? post.userId.name
                                : t.user || "User"}
                            </p>

                            <p className="text-xs text-gray-500">
                              {formatDate(post.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Three Dots */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              setOpenMenu(
                                openMenu === post._id ? null : post._id,
                              );
                            }}
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 ${
                              openMenu === post._id ? "bg-gray-100" : ""
                            }`}
                            title={t.postOptions || "Post options"}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>

                          {openMenu === post._id && (
                            <div
                              className="absolute right-0 top-11 z-50 w-48 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isOwnPost(post) ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditing(post)}
                                    className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Pencil className="h-4 w-4 shrink-0" />
                                    {t.editPost || "Edit post"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => deletePost(post._id)}
                                    className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 shrink-0" />
                                    {t.deletePost || "Delete post"}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => reportPost(post._id)}
                                  className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Flag className="h-4 w-4 shrink-0" />
                                  {t.reportPost || "Report post"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-3 pb-4 sm:px-5">
                      {editingPost === post._id ? (
                        <div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={5}
                            className="min-h-32 w-full resize-y rounded-md border border-gray-300 px-3 py-3 text-sm leading-6 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />

                          <div className="mt-3 flex flex-col gap-2 min-[400px]:flex-row">
                            <button
                              type="button"
                              onClick={() => saveEdit(post._id)}
                              className="min-h-10 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                            >
                              {t.save || "Save"}
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="min-h-10 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              {t.cancel || "Cancel"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {post.content && (
                            <p className="break-words whitespace-pre-wrap leading-6 text-gray-800">
                              {post.content}
                            </p>
                          )}

                          {post.imageUrl && (
                            <img
                              src={post.imageUrl}
                              alt={t.communityPostAlt || "Community post"}
                              className="mt-4 max-h-[500px] w-full rounded-lg border border-gray-200 object-cover"
                            />
                          )}

                          {post.codeSnippet && (
                            <pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-gray-950 p-3 font-mono text-sm text-green-400 sm:p-4">
                              <code>{post.codeSnippet}</code>
                            </pre>
                          )}

                          {post.projectUrl && (
                            <a
                              href={post.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex max-w-full items-center gap-2 break-all text-sm text-blue-600 hover:underline"
                            >
                              <FolderGit2 className="h-4 w-4 shrink-0" />
                              {t.viewProject || "View Project"}
                            </a>
                          )}

                          {post.hashtags?.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {post.hashtags.map((hashtag) => (
                                <button
                                  key={hashtag}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    selectHashtag(hashtag);
                                  }}
                                  className={`break-all text-sm font-medium ${
                                    selectedHashtag ===
                                    hashtag
                                      .replace(/^#/, "")
                                      .trim()
                                      .toLowerCase()
                                      ? "rounded bg-blue-50 px-2 py-1 text-blue-800"
                                      : "text-blue-600 hover:underline"
                                  }`}
                                >
                                  #{hashtag}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500 sm:px-5">
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span>
                          {post.likes?.length || 0} {t.likes || "likes"}
                        </span>

                        <span>·</span>

                        <span>
                          {post.comments?.length || 0}{" "}
                          {t.comments || "comments"}
                        </span>

                        <span>·</span>

                        <span>
                          {post.shares?.length || 0} {t.shares || "shares"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-t border-gray-100 px-2 py-2 sm:px-3">
                      <button
                        type="button"
                        onClick={() => toggleLike(post._id)}
                        className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 text-xs sm:gap-2 sm:text-sm ${
                          isLiked(post)
                            ? "bg-red-50 text-red-600"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Heart
                          className="h-4 w-4 shrink-0"
                          fill={isLiked(post) ? "currentColor" : "none"}
                        />
                        <span className="truncate">{t.like || "Like"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedComments(
                            expandedComments === post._id ? null : post._id,
                          )
                        }
                        className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 text-xs text-gray-600 hover:bg-gray-50 sm:gap-2 sm:text-sm"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" />

                        <span className="truncate">
                          {t.comment || "Comment"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => sharePost(post._id)}
                        className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 text-xs text-gray-600 hover:bg-gray-50 sm:gap-2 sm:text-sm"
                      >
                        <Share2 className="h-4 w-4 shrink-0" />

                        <span className="truncate">{t.share || "Share"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(post._id)}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm transition-colors ${
                          isBookmarked(post)
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                        title={
                          isBookmarked(post)
                            ? t.removeBookmark || "Remove bookmark"
                            : t.bookmark || "Bookmark"
                        }
                      >
                        <Bookmark
                          className="h-4 w-4"
                          fill={isBookmarked(post) ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    {/* Comments */}
                    {expandedComments === post._id && (
                      <div className="border-t border-gray-100 p-3 sm:p-5">
                        <div className="space-y-3">
                          {post.comments?.length > 0 ? (
                            post.comments
                              .filter((comment) => !comment.parentCommentId)
                              .map((comment) => renderComment(post, comment))
                          ) : (
                            <p className="text-sm text-gray-500">
                              {t.noCommentsYet || "No comments yet."}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex min-w-0 gap-2">
                          <input
                            value={commentText[post._id] || ""}
                            onChange={(e) =>
                              setCommentText((current) => ({
                                ...current,
                                [post._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addComment(post._id);
                              }
                            }}
                            placeholder={t.writeComment || "Write a comment..."}
                            className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />

                          <button
                            type="button"
                            onClick={() => addComment(post._id)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className="px-3 py-8 text-center text-sm text-gray-500">
                {t.endOfFeed || "You've reached the end of the community feed."}
              </p>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-20 space-y-5">
              <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
                <h2 className="font-semibold text-gray-900">
                  {t.community || "Community"}
                </h2>

                <p className="mt-2 break-words text-sm leading-5 text-gray-600">
                  {t.communitySidebarDescription ||
                    "Share your knowledge, projects, achievements and learning journey with other developers."}
                </p>
              </div>

              {showTrending && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">
                      {t.trending || "Trending"}
                    </h2>

                    <TrendingUp className="h-4 w-4 shrink-0 text-blue-600" />
                  </div>

                  {trendingPosts.length === 0 ? (
                    <p className="break-words text-sm text-gray-500">
                      {t.noTrendingPostsYet || "No trending posts yet."}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {trendingPosts.map((post) => (
                        <div
                          key={post._id}
                          className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                        >
                          <p className="break-words text-sm font-medium text-gray-900">
                            {post.content ||
                              t.communityPost ||
                              "Community post"}
                          </p>

                          {post.hashtags?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.hashtags.map((hashtag) => {
                                const cleanHashtag = hashtag
                                  .replace(/^#/, "")
                                  .trim()
                                  .toLowerCase();

                                return (
                                  <button
                                    key={hashtag}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectHashtag(cleanHashtag);
                                    }}
                                    className="break-all text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    #{cleanHashtag}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <p className="mt-1 text-xs text-gray-500">
                            {post.likes?.length || 0} {t.likes || "likes"}
                            {" · "}
                            {post.comments?.length || 0}{" "}
                            {t.comments || "comments"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
};

export default CommunityPage;
