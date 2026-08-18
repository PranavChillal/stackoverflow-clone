import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Calendar } from "lucide-react";

import MainLayout from "@/layout/MainLayout";
import { Input } from "@/components/ui/input";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosinstance";

const index = () => {
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
        user.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="max-w-6xl">
                <h1 className="text-xl lg:text-2xl font-semibold mb-6">
                    Users
                </h1>

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

                        <Input
                            placeholder="Filter by user"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredUsers.map((user) => (
                        <Link
                            key={user._id}
                            href={`/users/${user._id}`}
                        >
                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center mb-3">
                                    <Avatar className="w-12 h-12 mr-3">
                                        <AvatarFallback className="text-lg">
                                            {user.name
                                                ?.split(" ")
                                                .map((n: string) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-blue-600 hover:text-blue-800 truncate">
                                            {user.name}
                                        </h3>

                                        <p className="text-sm text-gray-600 truncate">
                                            @{user.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center text-sm text-gray-600 mb-3">
                                    <Calendar className="w-4 h-4 mr-1" />

                                    <span>
                                        Joined{" "}
                                        {new Date(
                                            user.joinDate
                                        ).getFullYear()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
};

export default index;