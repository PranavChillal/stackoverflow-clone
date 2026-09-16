"use client";

import { useEffect, useState } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

interface Session {
  _id: string;
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  ipAddress?: string;
  location?: string;
  loginAt?: string;
  lastActivityAt?: string;
  trustedDevice?: boolean;
  expiresAt?: string;
  current?: boolean;
}

const ActiveSessions = () => {
  const auth = useAuth() as any;
  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;
  const t = translations[languageKey] || translations.english;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = async () => {
    try {
      const response = await axiosInstance.get("/user/sessions");

      setSessions(response.data?.data || []);
    } catch (error: any) {
      console.log("Unable to load sessions:", error);

      toast.error(error.response?.data?.message || t.activeSessionsLoadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      setRevoking(sessionId);

      await axiosInstance.delete(`/user/sessions/${sessionId}`);

      setSessions((currentSessions) =>
        currentSessions.filter((session) => session._id !== sessionId),
      );

      toast.success(t.sessionRevokedSuccessfully);
    } catch (error: any) {
      console.log("Unable to revoke session:", error);

      toast.error(error.response?.data?.message || t.unableRevokeSession);
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    const type = deviceType?.toLowerCase();

    if (type === "mobile" || type === "phone") {
      return <Smartphone className="h-6 w-6" />;
    }

    if (type === "tablet") {
      return <Tablet className="h-6 w-6" />;
    }

    return <Monitor className="h-6 w-6" />;
  };

  const formatDate = (date?: string) => {
    if (!date) {
      return t.unknown;
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="mb-6 w-full min-w-0">
      <div className="overflow-hidden rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-gray-900">
                  {t.activeSessions}
                </h3>

                <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                  {t.manageActiveSessions}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
            title={t.refreshSessions}
            aria-label={t.refreshSessions}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            {t.loadingActiveSessions}
          </div>
        ) : sessions.length === 0 ? (
          /* Empty State */
          <div className="py-8 text-center">
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-gray-300" />

            <p className="break-words text-gray-600">{t.noActiveSessions}</p>
          </div>
        ) : (
          /* Sessions */
          <div className="space-y-3 sm:space-y-4">
            {sessions.map((session) => (
              <div
                key={session._id}
                className={`min-w-0 overflow-hidden rounded-lg border p-3 sm:p-4 ${
                  session.current
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-gray-200"
                }`}
              >
                <div className="flex min-w-0 flex-col gap-4">
                  {/* Session Information */}
                  <div className="flex min-w-0 gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 sm:h-11 sm:w-11">
                      {getDeviceIcon(session.deviceType)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Browser + Badges */}
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h4 className="min-w-0 break-words font-semibold text-gray-900">
                          {session.browser || t.unknownBrowser}
                        </h4>

                        {session.current && (
                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            {t.thisDevice}
                          </span>
                        )}

                        {session.trustedDevice && (
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            {t.trusted}
                          </span>
                        )}
                      </div>

                      {/* Operating System */}
                      <p className="mt-1 break-words text-sm text-gray-600">
                        {session.operatingSystem || t.unknownOperatingSystem}
                      </p>

                      {/* Session Details */}
                      <div className="mt-3 space-y-2 text-sm text-gray-500">
                        <p className="break-words">
                          <span className="font-medium text-gray-700">
                            {t.device}:
                          </span>{" "}
                          {session.deviceType || t.unknown}
                        </p>

                        <p className="break-words">
                          <span className="font-medium text-gray-700">
                            {t.ip}:
                          </span>{" "}
                          {session.ipAddress || t.unavailable}
                        </p>

                        {session.location && (
                          <p className="break-words">
                            <span className="font-medium text-gray-700">
                              {t.location}:
                            </span>{" "}
                            {session.location}
                          </p>
                        )}

                        <p className="break-words">
                          <span className="font-medium text-gray-700">
                            {t.login}:
                          </span>{" "}
                          {formatDate(session.loginAt)}
                        </p>

                        <p className="break-words">
                          <span className="font-medium text-gray-700">
                            {t.lastActive}:
                          </span>{" "}
                          {formatDate(session.lastActivityAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Revoke */}
                  <div className="flex w-full sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleRevoke(session._id)}
                      disabled={revoking === session._id}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:w-auto"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />

                      <span className="break-words">
                        {revoking === session._id ? t.revoking : t.revoke}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSessions;
