import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Calendar } from "lucide-react";

import MainLayout from "@/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

const index = () => {
  const auth = useAuth() as any;

  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;
  const t = translations[languageKey] || translations.english;

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await axiosInstance.get("/user/getalluser");

        setUsers(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };

    getUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <MainLayout>
      <div className="w-full min-w-0 max-w-6xl">
        {/* Page Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="break-words text-xl font-semibold text-gray-900 sm:text-2xl">
            {t.users}
          </h1>
        </div>

        {/* Search */}
        <div className="mb-5 sm:mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              placeholder={t.filterByUser}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full pl-10"
            />
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => (
            <Link
              key={user._id}
              href={`/users/${user._id}`}
              className="block min-w-0"
            >
              <div className="h-full min-w-0 cursor-pointer rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md">
                {/* User Header */}
                <div className="mb-3 flex min-w-0 items-center">
                  <Avatar className="mr-3 h-12 w-12 shrink-0">
                    <AvatarFallback className="text-lg">
                      {user.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-blue-600 hover:text-blue-800">
                      {user.name}
                    </h3>

                    <p className="truncate text-sm text-gray-600">
                      @{user.name}
                    </p>
                  </div>
                </div>

                {/* Join Date */}
                <div className="flex min-w-0 items-center text-sm text-gray-600">
                  <Calendar className="mr-1 h-4 w-4 shrink-0" />

                  <span className="min-w-0 break-words">
                    {t.joined} {new Date(user.joinDate).getFullYear()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredUsers.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            {search ? "No users found." : "No users available."}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default index;
