"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "./button";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import translations from "@/lib/translations";
import axiosInstance from "@/lib/axiosinstance";

interface NavbarProps {
  handleslidein?: () => void;
}

interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
  type: string;
  postId?: {
    _id?: string;
    content?: string;
    postType?: string;
  } | null;
  message: string;
  read: boolean;
  createdAt: string;
}

const Navbar = ({ handleslidein }: NavbarProps) => {
  const auth = useAuth() as any;

  const { user, Logout, language, loading: authLoading } = auth;

  const router = useRouter();

  const [searchText, setSearchText] = useState("");

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notificationLoading, setNotificationLoading] = useState(false);

  const [notificationSessionInvalid, setNotificationSessionInvalid] =
    useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

  const userId = user?._id ? String(user._id) : null;

  const currentLanguage = language || "english";

  const languageKey = currentLanguage as keyof typeof translations;

  const t = translations[languageKey] || translations.english;

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedSearch = searchText.trim();

    if (!trimmedSearch) {
      router.push("/");
      return;
    }

    router.push(`/?search=${encodeURIComponent(trimmedSearch)}`);
  };

  /*
  |--------------------------------------------------------------------------
  | Load Notifications
  |--------------------------------------------------------------------------
  */

  const loadNotifications = async () => {
    /*
     * Do not make protected notification requests
     * while AuthContext is still initializing.
     */

    if (authLoading || !user) {
      setNotifications([]);
      return;
    }

    /*
     * Once the backend has rejected the current session,
     * stop repeatedly hitting the endpoint.
     */

    if (notificationSessionInvalid) {
      return;
    }

    try {
      setNotificationLoading(true);

      const response = await axiosInstance.get("/post/notifications");

      setNotifications(response.data?.data || []);

      /*
       * A successful request means the session
       * is valid again.
       */

      setNotificationSessionInvalid(false);
    } catch (error: any) {
      /*
       * 401 here means the local user state and
       * backend session are out of sync.
       *
       * Do not print a scary Axios error to the console.
       */

      if (error?.response?.status === 401) {
        setNotifications([]);
        setNotificationOpen(false);
        setNotificationSessionInvalid(true);

        /*
         * Clear stale local authentication state.
         * This prevents Navbar from repeatedly trying
         * the protected endpoint.
         */

        try {
          Logout();
        } catch {
          // Ignore logout cleanup errors.
        }

        return;
      }

      /*
       * Only unexpected errors are logged.
       */

      console.error("Unable to load notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Notification Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    /*
     * Auth is still initializing.
     */

    if (authLoading) {
      return;
    }

    /*
     * No authenticated user.
     */

    if (!user) {
      setNotifications([]);
      setNotificationSessionInvalid(false);
      return;
    }

    /*
     * Reset this whenever a fresh authenticated
     * user appears.
     */

    setNotificationSessionInvalid(false);

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user, authLoading]);

  /*
  |--------------------------------------------------------------------------
  | Close Notification Dropdown
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Mark Notifications As Read
  |--------------------------------------------------------------------------
  */

  const markNotificationsRead = async () => {
    if (authLoading || !user || notificationSessionInvalid) {
      return;
    }

    try {
      await axiosInstance.patch("/post/notifications/read");

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    } catch (error: any) {
      /*
       * A stale session should not create
       * another noisy console error.
       */

      if (error?.response?.status === 401) {
        setNotifications([]);
        setNotificationOpen(false);
        setNotificationSessionInvalid(true);

        try {
          Logout();
        } catch {
          // Ignore logout cleanup errors.
        }

        return;
      }

      console.error("Unable to mark notifications as read:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Notification Toggle
  |--------------------------------------------------------------------------
  */

  const handleNotificationToggle = async () => {
    const nextState = !notificationOpen;

    setNotificationOpen(nextState);

    if (nextState && user && !authLoading && !notificationSessionInvalid) {
      await loadNotifications();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Notification Helpers
  |--------------------------------------------------------------------------
  */

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const getNotificationText = (notification: NotificationItem) => {
    const senderName = notification.senderId?.name || "Someone";

    return `${senderName} ${notification.message}`;
  };

  const getNotificationTime = (createdAt: string) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    setNotifications([]);
    setNotificationOpen(false);
    setNotificationSessionInvalid(false);

    Logout();
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <nav className="relative z-50 flex h-[53px] w-full items-center border-b bg-white px-2 sm:px-4">
      {/* Mobile / Tablet Menu */}

      <button
        type="button"
        onClick={handleslidein}
        aria-label="Open navigation menu"
        className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-gray-100 lg:hidden"
      >
        <Menu size={21} className="text-gray-700" />
      </button>

      {/* Logo */}

      <Link
        href="/"
        className="mr-2 flex shrink-0 items-center gap-2 sm:mr-5 lg:mr-8"
      >
        <img src="/logo.png" alt="CodeQuest" className="h-8 w-auto" />

        <span className="hidden text-lg font-bold sm:inline">CodeQuest</span>
      </Link>

      {/* Desktop Navigation */}

      <div className="hidden items-center gap-6 lg:flex xl:gap-8">
        <Link href="/">{t.about}</Link>

        <Link href="/">{t.products}</Link>

        <Link href="/">{t.forTeams}</Link>
      </div>

      {/* Search */}

      <form
        onSubmit={handleSearch}
        className="mx-2 min-w-0 flex-1 sm:mx-4 lg:mx-6 xl:mx-8"
      >
        <div className="relative mx-auto max-w-xl">
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={t.searchQuestions}
            className="h-9 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:pl-10"
          />

          <button
            type="submit"
            aria-label={t.search}
            className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center sm:w-10"
          >
            <Search size={18} className="text-gray-500" />
          </button>
        </div>
      </form>

      {/* Authentication */}

      <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
        {user ? (
          <>
            {/* Notifications */}

            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={handleNotificationToggle}
                aria-label={t.notifications}
                className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
              >
                <Bell size={20} className="text-gray-700" />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-11 w-[calc(100vw-1rem)] max-w-96 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl sm:w-96">
                  {/* Header */}

                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {t.notifications}
                      </h3>

                      {unreadCount > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          {unreadCount} {t.unread}
                        </p>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markNotificationsRead}
                        className="ml-3 shrink-0 text-xs text-blue-600 hover:text-blue-800"
                      >
                        {t.markAllAsRead}
                      </button>
                    )}
                  </div>

                  {/* Notification List */}

                  <div className="max-h-[70vh] overflow-y-auto">
                    {notificationLoading ? (
                      <div className="p-6 text-center text-sm text-gray-500">
                        {t.loadingNotifications}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell
                          size={28}
                          className="mx-auto mb-2 text-gray-300"
                        />

                        <p className="text-sm font-medium text-gray-700">
                          {t.noNotifications}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {t.allCaughtUp}
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`border-b px-4 py-3 last:border-b-0 ${
                            notification.read ? "bg-white" : "bg-blue-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                              {notification.senderId?.name
                                ?.charAt(0)
                                .toUpperCase() || "?"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm text-gray-800">
                                {getNotificationText(notification)}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {getNotificationTime(notification.createdAt)}
                              </p>
                            </div>

                            {!notification.read && (
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}

            {userId ? (
              <Link href={`/users/${userId}`}>
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-orange-500 font-semibold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </Link>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 font-semibold text-white">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            {/* Logout */}

            <Button
              variant="outline"
              onClick={handleLogout}
              className="hidden border-black bg-black text-white hover:bg-gray-900 hover:text-white sm:inline-flex"
            >
              {t.logOut}
            </Button>
          </>
        ) : (
          <Link href="/auth">
            <Button variant="outline">{t.logIn}</Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
