import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Calendar, Edit, Plus, X, CreditCard, Download } from "lucide-react";
import { toast } from "react-toastify";

import MainLayout from "@/layout/MainLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ActiveSessions from "@/components/ui/ActiveSessions";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const auth = useAuth() as any;
  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;
  const t = translations[languageKey] || translations.english;
  const p = (t as any).profile || (translations.english as any).profile;

  const localeMap: Record<string, string> = {
    english: "en-IN",
    spanish: "es-ES",
    hindi: "hi-IN",
    portuguese: "pt-PT",
    chinese: "zh-CN",
    french: "fr-FR",
  };

  const locale = localeMap[language] || "en-IN";

  const translateReputationReason = (reason: string) => {
    if (!reason) return "";

    const normalizedReason = reason.trim();

    if (normalizedReason === "Downvote received") {
      return p.downvoteReceived;
    }

    if (normalizedReason === "Downvote removed") {
      return p.downvoteRemoved;
    }

    if (normalizedReason === "Answer accepted") {
      return p.answerAccepted;
    }

    if (normalizedReason === "Content removed by administrator") {
      return p.contentRemoved;
    }

    const transferPrefix = "Reputation transferred to ";

    if (normalizedReason.startsWith(transferPrefix)) {
      return `${p.reputationTransferredTo} ${normalizedReason.slice(
        transferPrefix.length,
      )}`;
    }

    return reason;
  };

  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [reputationHistory, setReputationHistory] = useState<any[]>([]);
  const [reputationTransfers, setReputationTransfers] = useState<any[]>([]);

  const [subscription, setSubscription] = useState<any>(null);
  const [profileSubscription, setProfileSubscription] = useState<any>(null);

  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");

  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(
    null,
  );

  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null);

  const [transferReceiverId, setTransferReceiverId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    about: "",
    tags: [] as string[],
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.log("Unable to read stored user", error);
      }
    }
  }, []);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!router.isReady || !id) return;

    let cancelled = false;

    const getUser = async () => {
      try {
        setLoading(true);

        const profileId = Array.isArray(id) ? id[0] : id;

        const userResponse = await axiosInstance.get("/user/getalluser");

        const users = Array.isArray(userResponse.data)
          ? userResponse.data
          : Array.isArray(userResponse.data?.data)
            ? userResponse.data.data
            : [];

        const foundUser = users.find(
          (item: any) => String(item._id) === String(profileId),
        );

        if (cancelled) return;

        if (foundUser) {
          setUser(foundUser);
          setProfileSubscription(foundUser.subscription || null);

          setEditForm({
            name: foundUser.name || "",
            phone: foundUser.phone || "",
            about: foundUser.about || "",
            tags: foundUser.tags || [],
          });

          try {
            const reputationResponse = await axiosInstance.get(
              `/user/reputation-history/${profileId}`,
            );

            if (!cancelled) {
              setReputationHistory(
                reputationResponse.data?.data?.history || [],
              );
            }
          } catch (historyError) {
            console.log("Unable to load reputation history:", historyError);

            if (!cancelled) {
              setReputationHistory([]);
            }
          }
        } else {
          setUser(null);
          setProfileSubscription(null);
        }
      } catch (error) {
        if (cancelled) return;

        console.log("Unable to load user:", error);
        toast.error(p.unableLoadUser);

        setUser(null);
        setProfileSubscription(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    getUser();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, id]);

  const isOwnProfile =
    Boolean(currentUser?._id) &&
    Boolean(user?._id) &&
    String(currentUser._id) === String(user._id);

  useEffect(() => {
    if (!user?._id || isOwnProfile) {
      setIsFollowing(false);
      setFollowersCount(user?.followers?.length || 0);
      return;
    }

    let cancelled = false;

    const getFollowStatus = async () => {
      try {
        const response = await axiosInstance.get(`/follow/status/${user._id}`);

        if (cancelled) return;

        const data = response.data?.data;

        setIsFollowing(Boolean(data?.following));

        setFollowersCount(
          typeof data?.followers === "number"
            ? data.followers
            : user?.followers?.length || 0,
        );
      } catch (error) {
        if (cancelled) return;

        console.log("Unable to load follow status:", error);

        setIsFollowing(false);
        setFollowersCount(user?.followers?.length || 0);
      }
    };

    getFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [user?._id, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!currentUser?._id || !user?._id || isOwnProfile) {
      return;
    }

    try {
      setFollowLoading(true);

      const response = await axiosInstance.patch(`/follow/${user._id}`);

      const data = response.data?.data;

      setIsFollowing(Boolean(data?.following));

      if (typeof data?.followers === "number") {
        setFollowersCount(data.followers);
      }

      toast.success(
        response.data?.message ||
          (data?.following ? p.followedSuccessfully : p.unfollowedSuccessfully),
      );
    } catch (error: any) {
      console.log("Toggle follow error:", error);

      toast.error(error.response?.data?.message || p.unableFollow);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwnProfile) {
      setReputationTransfers([]);
      return;
    }

    let cancelled = false;

    const getReputationTransfers = async () => {
      try {
        const response = await axiosInstance.get("/reputation/transfers");

        if (!cancelled) {
          setReputationTransfers(response.data?.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("Unable to load reputation transfers:", error);
          setReputationTransfers([]);
        }
      }
    };

    getReputationTransfers();

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile) {
      setSubscription(null);
      return;
    }

    let cancelled = false;

    const getSubscription = async () => {
      try {
        const response = await axiosInstance.get("/subscription/status");

        if (!cancelled) {
          setSubscription(response.data?.data || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("Unable to load subscription:", error);
          setSubscription(null);
        }
      }
    };

    getSubscription();

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile) {
      setPaymentHistory([]);
      return;
    }

    let cancelled = false;

    const getPaymentHistory = async () => {
      try {
        const response = await axiosInstance.get("/subscription/payments");

        if (!cancelled) {
          setPaymentHistory(response.data?.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.log("Unable to load payment history:", error);
          setPaymentHistory([]);
        }
      }
    };

    getPaymentHistory();

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile]);

  const handleSubscribe = async (plan: "bronze" | "silver" | "gold") => {
    try {
      setSubscriptionLoading(plan);

      const orderResponse = await axiosInstance.post(
        "/subscription/create-order",
        {
          plan,
        },
      );

      const order = orderResponse.data?.data;

      if (!order?.orderId) {
        throw new Error(p.unableCreatePaymentOrder);
      }

      if (!window.Razorpay) {
        throw new Error(p.razorpayNotLoaded);
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Stackoverflow Clone",
        description: `${order.planName} Membership`,
        order_id: order.orderId,

        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
          contact: currentUser?.phone || "",
        },

        theme: {
          color: "#2563eb",
        },

        handler: async (response: any) => {
          try {
            const verifyResponse = await axiosInstance.post(
              "/subscription/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            );

            toast.success(
              verifyResponse.data?.message || p.subscriptionActivated,
            );

            const subscriptionResponse = await axiosInstance.get(
              "/subscription/status",
            );

            setSubscription(subscriptionResponse.data?.data || null);

            const paymentResponse = await axiosInstance.get(
              "/subscription/payments",
            );

            setPaymentHistory(paymentResponse.data?.data || []);
          } catch (error: any) {
            console.log("Payment verification error:", error);

            toast.error(
              error.response?.data?.message || p.paymentVerificationFailed,
            );
          } finally {
            setSubscriptionLoading(null);
          }
        },

        modal: {
          ondismiss: () => {
            setSubscriptionLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response: any) => {
        console.log("Payment failed:", response);

        toast.error(p.paymentFailed);

        setSubscriptionLoading(null);
      });

      razorpay.open();
    } catch (error: any) {
      console.log("Subscription payment error:", error);

      toast.error(
        error.response?.data?.message || error.message || p.unableStartPayment,
      );

      setSubscriptionLoading(null);
    }
  };

  const handleDownloadInvoice = async (
    paymentId: string,
    invoiceNumber?: string,
  ) => {
    try {
      setInvoiceLoading(paymentId);

      const response = await axiosInstance.get(
        `/subscription/invoice/${paymentId}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `${invoiceNumber || "invoice"}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success(p.invoiceDownloaded);
    } catch (error) {
      console.log("Invoice download error:", error);

      toast.error(p.unableDownloadInvoice);
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleTransferReputation = async () => {
    const receiverId = transferReceiverId.trim();
    const amount = Number(transferAmount);
    const reason = transferReason.trim();

    if (!receiverId) {
      toast.error(p.receiverRequired);
      return;
    }

    if (!amount || !Number.isInteger(amount)) {
      toast.error(p.amountWhole);
      return;
    }

    if (amount <= 0) {
      toast.error(p.amountGreater);
      return;
    }

    if (amount > 50) {
      toast.error(p.max50Transaction);
      return;
    }

    if (!reason) {
      toast.error(p.reasonRequired);
      return;
    }

    if ((user?.reputation || 0) <= 50) {
      toast.error(p.moreThan50);
      return;
    }

    if ((user?.reputation || 0) < amount) {
      toast.error(p.insufficientReputation);
      return;
    }

    try {
      setTransferLoading(true);

      const response = await axiosInstance.post("/reputation/transfer", {
        receiverId,
        amount,
        reason,
      });

      const data = response.data?.data;

      if (typeof data?.senderReputation === "number") {
        setUser((previousUser: any) => ({
          ...previousUser,
          reputation: data.senderReputation,
        }));

        if (currentUser?._id === user?._id) {
          const updatedUser = {
            ...currentUser,
            reputation: data.senderReputation,
          };

          setCurrentUser(updatedUser);

          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }

      setTransferReceiverId("");
      setTransferAmount("");
      setTransferReason("");

      const historyResponse = await axiosInstance.get("/reputation/transfers");

      setReputationTransfers(historyResponse.data?.data || []);

      toast.success(response.data?.message || p.transferredSuccess);
    } catch (error: any) {
      console.log("Reputation transfer error:", error);

      toast.error(error.response?.data?.message || p.unableTransfer);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();

    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm({
        ...editForm,
        tags: [...editForm.tags, trimmedTag],
      });

      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSaveProfile = async () => {
    if (!user?._id) return;

    if (editForm.phone && !/^[0-9]{10}$/.test(editForm.phone)) {
      toast.error(p.validMobile);
      return;
    }

    try {
      const res = await axiosInstance.patch(`/user/update/${user._id}`, {
        name: editForm.name,
        phone: editForm.phone,
        about: editForm.about,
        tags: editForm.tags,
      });

      setUser(res.data.data);
      setIsEditing(false);

      localStorage.setItem("user", JSON.stringify(res.data.data));
      setCurrentUser(res.data.data);

      toast.success(p.profileUpdated);
    } catch (error) {
      console.log(error);
      toast.error(p.unableUpdateProfile);
    }
  };

  const successfulPayments = paymentHistory.filter(
    (payment: any) => payment.status === "paid",
  );

  const billingPayment = successfulPayments.find(
    (payment: any) => payment.billingDetails,
  );

  const billingDetails = billingPayment?.billingDetails;

  const displayedSubscription = isOwnProfile
    ? subscription
    : profileSubscription;

  const activeProfilePlan =
    displayedSubscription?.status === "active"
      ? displayedSubscription?.plan || "free"
      : "free";

  const isEnhancedProfile =
    activeProfilePlan === "silver" || activeProfilePlan === "gold";

  const isFeaturedProfile = activeProfilePlan === "gold";

  const profileHeaderClass = isFeaturedProfile
    ? "rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 via-white to-amber-50 p-6 shadow-lg"
    : isEnhancedProfile
      ? "rounded-2xl border border-gray-300 bg-gradient-to-r from-gray-50 via-white to-slate-50 p-6 shadow-md"
      : "p-0";

  const formatDate = (date: string) => {
    if (!date) return "";

    return new Date(date).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="w-full min-w-0 p-3 sm:p-4 md:p-6">{p.loading}</div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="w-full min-w-0 p-3 sm:p-4 md:p-6">{p.userNotFound}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full min-w-0 max-w-6xl">
        <div
          className={`${profileHeaderClass} mb-6 flex min-w-0 flex-col items-start gap-4 overflow-hidden sm:mb-8 sm:gap-6 md:flex-row`}
        >
          <Avatar
            className={`h-24 w-24 shrink-0 sm:h-28 sm:w-28 md:h-32 md:w-32 ${
              isFeaturedProfile
                ? "ring-4 ring-yellow-300 ring-offset-2"
                : isEnhancedProfile
                  ? "ring-2 ring-gray-300 ring-offset-2"
                  : ""
            }`}
          >
            <AvatarFallback className="text-3xl">
              {user.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="w-full min-w-0 flex-1">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="break-words text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                    {user.name}
                  </h1>

                  {displayedSubscription?.plan &&
                    displayedSubscription.plan !== "free" &&
                    displayedSubscription.status === "active" && (
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          displayedSubscription.plan === "bronze"
                            ? "bg-amber-100 text-amber-700"
                            : displayedSubscription.plan === "silver"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {displayedSubscription.plan.charAt(0).toUpperCase() +
                          displayedSubscription.plan.slice(1)}{" "}
                        {p.member}
                      </span>
                    )}

                  {isEnhancedProfile && (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        isFeaturedProfile
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isFeaturedProfile
                        ? p.featuredProfile
                        : p.enhancedProfile}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap items-center text-sm text-gray-600">
                  <Calendar className="mr-2 h-4 w-4 shrink-0" />

                  <span>
                    {p.memberSince}{" "}
                    {user.joinDate
                      ? new Date(user.joinDate).toISOString().split("T")[0]
                      : p.unknown}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">
                      {user.reputation || 0}
                    </span>

                    <span className="text-gray-600">{p.reputation}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">
                      {isOwnProfile
                        ? user.followers?.length || 0
                        : followersCount}
                    </span>

                    <span className="text-gray-600">{p.followers}</span>
                  </div>
                </div>

                {isEnhancedProfile && (
                  <div
                    className={`mt-4 inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                      isFeaturedProfile
                        ? "bg-yellow-50 text-yellow-800"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {isFeaturedProfile
                      ? p.featuredMemberProfile
                      : p.enhancedMemberProfile}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                    <span className="font-semibold">5</span>
                    <span className="text-gray-600 ml-1">{p.goldBadges}</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2" />
                    <span className="font-semibold">23</span>
                    <span className="text-gray-600 ml-1">{p.silverBadges}</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-600 rounded-full mr-2" />
                    <span className="font-semibold">45</span>
                    <span className="text-gray-600 ml-1">{p.bronzeBadges}</span>
                  </div>
                </div>
              </div>

              {isOwnProfile ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditForm({
                      name: user.name || "",
                      phone: user.phone || "",
                      about: user.about || "",
                      tags: user.tags || [],
                    });

                    setIsEditing(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4 shrink-0" />
                  {p.editProfile}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followLoading || !currentUser?._id}
                  variant={isFollowing ? "outline" : "default"}
                  className={
                    isFollowing
                      ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }
                >
                  {followLoading
                    ? p.updating
                    : isFollowing
                      ? p.following
                      : p.follow}
                </Button>
              )}
            </div>
          </div>
        </div>

        {isOwnProfile && <ActiveSessions />}

        {isOwnProfile && subscription && (
          <div className="mb-6">
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />

                <h3 className="text-lg font-semibold">
                  {p.currentSubscription}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">{p.plan}</p>

                  <p className="font-semibold capitalize">
                    {subscription.plan}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">{p.status}</p>

                  <p className="font-semibold capitalize text-green-600">
                    {subscription.status}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">{p.amount}</p>

                  <p className="font-semibold">
                    ₹{subscription.amount}/{p.month}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">{p.renewalDate}</p>

                  <p className="font-semibold">
                    {subscription.renewalDate
                      ? new Date(subscription.renewalDate).toLocaleDateString(
                          locale,
                        )
                      : p.na}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isOwnProfile && (
          <div className="mb-6">
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />

                  <h3 className="text-lg font-semibold">{p.paymentHistory}</h3>
                </div>

                <span className="text-sm text-gray-500">
                  {successfulPayments.length} {p.successful}{" "}
                  {successfulPayments.length === 1 ? p.payment : p.payments}
                </span>
              </div>

              {successfulPayments.length === 0 ? (
                <p className="text-gray-500">{p.noSuccessfulPayments}</p>
              ) : (
                <div className="space-y-4">
                  {successfulPayments.map((payment: any) => (
                    <div
                      key={payment._id}
                      className="border border-gray-100 rounded-lg p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-semibold capitalize">
                              {payment.plan}
                            </p>

                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                              {p.paid}
                            </span>
                          </div>

                          <p className="mt-1 break-words text-sm text-gray-500">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </p>

                          <p className="mt-1 break-words text-sm text-gray-500">
                            {p.invoice}:{" "}
                            <span className="text-gray-700">
                              {payment.invoiceNumber || p.generated}
                            </span>
                          </p>
                        </div>

                        <div className="min-w-0 text-left sm:text-right">
                          <p className="text-lg font-semibold">
                            ₹{payment.amount}
                          </p>

                          <p className="text-xs text-gray-500">
                            {payment.currency}
                          </p>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            disabled={invoiceLoading === payment._id}
                            onClick={() =>
                              handleDownloadInvoice(
                                payment._id,
                                payment.invoiceNumber,
                              )
                            }
                          >
                            <Download className="mr-2 h-4 w-4 shrink-0" />

                            {invoiceLoading === payment._id
                              ? p.downloading
                              : p.downloadInvoice}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isOwnProfile && (
          <div className="mb-6">
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-blue-600" />

                <h3 className="text-lg font-semibold">{p.billingDetails}</h3>
              </div>

              {!billingDetails ? (
                <p className="text-gray-500">{p.noBillingDetails}</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <p className="text-sm text-gray-500">{p.name}</p>

                    <p className="mt-1 break-words font-medium text-gray-900">
                      {billingDetails.name || p.notProvided}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{p.email}</p>

                    <p className="font-medium text-gray-900 mt-1 break-words">
                      {billingDetails.email || p.notProvided}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{p.phone}</p>

                    <p className="mt-1 break-words font-medium text-gray-900">
                      {billingDetails.phone || p.notProvided}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{p.country}</p>

                    <p className="mt-1 break-words font-medium text-gray-900">
                      {billingDetails.country || p.notProvided}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{p.address}</p>

                    <p className="mt-1 break-words font-medium text-gray-900">
                      {billingDetails.address || p.notProvided}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{p.city}</p>

                    <p className="mt-1 break-words font-medium text-gray-900">
                      {billingDetails.city || p.notProvided}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{p.state}</p>

                    <p className="mt-1 break-words font-medium text-gray-900">
                      {billingDetails.state || p.notProvided}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{p.postalCode}</p>

                    <p className="mt-1 break-words font-medium text-gray-900">
                      {billingDetails.postalCode || p.notProvided}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isOwnProfile && (
          <div className="mb-6">
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />

                <h3 className="text-lg font-semibold">{p.premiumMembership}</h3>
              </div>

              <p className="text-gray-600 mb-5">{p.upgradeAccount}</p>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="min-w-0 overflow-hidden rounded-lg border p-4 sm:p-5">
                  <h4 className="text-lg font-semibold">{p.bronze}</h4>

                  <p className="text-2xl font-bold mt-2">
                    ₹99
                    <span className="text-sm font-normal text-gray-500">
                      /{p.month}
                    </span>
                  </p>

                  <ul className="text-sm text-gray-600 mt-4 space-y-2">
                    <li>• {p.bronzeQuestions}</li>
                    <li>• {p.bronzeBadge}</li>
                    <li>• {p.advancedSearchFilters}</li>
                  </ul>

                  <Button
                    className="w-full mt-5"
                    disabled={
                      subscriptionLoading !== null ||
                      activeProfilePlan === "bronze"
                    }
                    onClick={() => handleSubscribe("bronze")}
                  >
                    {subscriptionLoading === "bronze"
                      ? p.processing
                      : activeProfilePlan === "bronze"
                        ? p.currentPlan
                        : p.switchToBronze}
                  </Button>
                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border p-4 sm:p-5">
                  <h4 className="text-lg font-semibold">{p.silver}</h4>

                  <p className="text-2xl font-bold mt-2">
                    ₹299
                    <span className="text-sm font-normal text-gray-500">
                      /{p.month}
                    </span>
                  </p>

                  <ul className="text-sm text-gray-600 mt-4 space-y-2">
                    <li>• {p.silverQuestions}</li>
                    <li>• {p.silverBadge}</li>
                    <li>• {p.prioritySupport}</li>
                    <li>• {p.unlimitedBookmarks}</li>
                  </ul>

                  <Button
                    className="w-full mt-5"
                    disabled={
                      subscriptionLoading !== null ||
                      activeProfilePlan === "silver"
                    }
                    onClick={() => handleSubscribe("silver")}
                  >
                    {subscriptionLoading === "silver"
                      ? p.processing
                      : activeProfilePlan === "silver"
                        ? p.currentPlan
                        : activeProfilePlan === "gold"
                          ? p.switchToSilver
                          : p.upgradeToSilver}
                  </Button>
                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border p-4 sm:p-5">
                  <h4 className="text-lg font-semibold">{p.gold}</h4>

                  <p className="text-2xl font-bold mt-2">
                    ₹999
                    <span className="text-sm font-normal text-gray-500">
                      /{p.month}
                    </span>
                  </p>

                  <ul className="text-sm text-gray-600 mt-4 space-y-2">
                    <li>• {p.unlimitedQuestions}</li>
                    <li>• {p.goldBadge}</li>
                    <li>• {p.highestSearchPriority}</li>
                    <li>• {p.featuredProfileVisibility}</li>
                    <li>• {p.exclusiveCommunityFeatures}</li>
                  </ul>

                  <Button
                    className="w-full mt-5"
                    disabled={
                      subscriptionLoading !== null ||
                      activeProfilePlan === "gold"
                    }
                    onClick={() => handleSubscribe("gold")}
                  >
                    {subscriptionLoading === "gold"
                      ? p.processing
                      : activeProfilePlan === "gold"
                        ? p.currentPlan
                        : p.upgradeToGold}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-6">{p.about}</h3>

            <p className="text-gray-700">{user.about || p.noInformation}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-6">{p.topTags}</h3>

            <div className="flex flex-wrap gap-2">
              {user.tags?.map((tag: string) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold">{p.reputationActivity}</h3>

              <span className="text-sm text-gray-500">
                {reputationHistory.length} {p.activities}
              </span>
            </div>

            {reputationHistory.length === 0 ? (
              <p className="text-gray-500">{p.noReputationActivity}</p>
            ) : (
              <div className="space-y-4">
                {reputationHistory.map((activity: any) => (
                  <div
                    key={activity._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {translateReputationReason(activity.reason)}
                      </p>

                      <p className="mt-1 break-words text-sm text-gray-500">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`font-semibold ${
                        activity.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {activity.amount > 0 ? "+" : ""}
                      {activity.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <div className="mb-6">
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">
                  {p.transferReputation}
                </h3>

                <p className="mt-1 break-words text-sm text-gray-500">
                  {p.transferDescription}
                </p>
              </div>

              {(user.reputation || 0) <= 50 ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-medium text-yellow-800">
                    {p.needMore50}
                  </p>

                  <p className="text-xs text-yellow-700 mt-1">
                    {p.currentReputation}: {user.reputation || 0}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <Label>{p.receiverUserId}</Label>

                    <Input
                      value={transferReceiverId}
                      placeholder={p.receiverPlaceholder}
                      onChange={(e) => setTransferReceiverId(e.target.value)}
                      className="mt-2"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      {p.askProfileId}
                    </p>
                  </div>

                  <div>
                    <Label>{p.reputationAmount}</Label>

                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={transferAmount}
                      placeholder={p.max50}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="mt-2"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      {p.maxTransfer}
                    </p>
                  </div>

                  <div>
                    <Label>{p.reason}</Label>

                    <Textarea
                      value={transferReason}
                      placeholder={p.reasonPlaceholder}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="mt-2 min-h-24"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {p.yourReputation}
                      </p>

                      <p className="text-2xl font-bold text-gray-900">
                        {user.reputation || 0}
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleTransferReputation}
                      disabled={transferLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {transferLoading ? p.transferring : p.transferReputation}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isOwnProfile && (
          <div className="mb-6">
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">{p.transfers}</h3>

                <span className="text-sm text-gray-500">
                  {reputationTransfers.length} {p.transfersLower}
                </span>
              </div>

              {reputationTransfers.length === 0 ? (
                <p className="text-gray-500">{p.noTransfers}</p>
              ) : (
                <div className="space-y-4">
                  {reputationTransfers.map((transfer: any) => {
                    const senderId =
                      transfer.senderId?._id || transfer.senderId;

                    const isSender =
                      String(senderId) === String(currentUser?._id);

                    const otherUser = isSender
                      ? transfer.receiverId
                      : transfer.senderId;

                    return (
                      <div
                        key={transfer._id}
                        className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">
                              {isSender
                                ? `${p.sent} ${transfer.amount} ${p.reputation} ${p.to} ${otherUser?.name || p.unknownUser}`
                                : `${p.received} ${transfer.amount} ${p.reputation} ${p.from} ${otherUser?.name || p.unknownUser}`}
                            </p>

                            <p className="mt-1 break-words text-sm text-gray-600">
                              {transfer.reason}
                            </p>

                            <p className="mt-1 break-words text-sm text-gray-500">
                              {formatDate(transfer.createdAt)}
                            </p>
                          </div>

                          <span
                            className={`font-semibold whitespace-nowrap ${
                              isSender ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {isSender ? "-" : "+"}
                            {transfer.amount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {isEditing && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setIsEditing(false)}
            />

            <div className="fixed inset-y-0 right-0 z-50 h-screen w-full max-w-md overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
                <h2 className="text-xl font-bold">{p.editProfile}</h2>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 p-4 sm:p-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {p.basicInformation}
                  </h3>

                  <Label>{p.displayName}</Label>

                  <Input
                    value={editForm.name}
                    placeholder={p.displayNamePlaceholder}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        name: e.target.value,
                      })
                    }
                    className="mt-2"
                  />

                  <div className="mt-4">
                    <Label>{p.mobileNumber}</Label>

                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={editForm.phone}
                      placeholder={p.mobilePlaceholder}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="mt-2"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      {p.mobileLanguageVerification}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">{p.about}</h3>

                  <Label>{p.aboutMe}</Label>

                  <Textarea
                    value={editForm.about}
                    placeholder={p.aboutMePlaceholder}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        about: e.target.value,
                      })
                    }
                    className="mt-2 min-h-32"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">{p.skillsTech}</h3>

                  <Label>{p.tags}</Label>

                  <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row">
                    <Input
                      value={newTag}
                      placeholder={p.addSkill}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />

                    <Button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {editForm.tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}

                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  {p.cancel}
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {p.saveChanges}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default index;
