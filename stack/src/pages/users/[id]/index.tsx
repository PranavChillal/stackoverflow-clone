import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Calendar, Edit, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

import MainLayout from "@/layout/MainLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/lib/axiosinstance";

const index = () => {
    const router = useRouter();
    const { id } = router.query;

    const [user, setUser] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newTag, setNewTag] = useState("");

    const [editForm, setEditForm] = useState({
        name: "",
        about: "",
        tags: [] as string[],
    });

    // Get the logged-in user from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                console.log("Unable to read stored user");
            }
        }
    }, []);

    // Get the profile user
    useEffect(() => {
        if (!router.isReady || !id) return;

        const getUser = async () => {
            try {
                setLoading(true);

                const res = await axiosInstance.get("/user/getalluser");

                console.log("Get all users response:", res.data);
                console.log("Profile ID from URL:", id);

                const users = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data?.data)
                    ? res.data.data
                    : [];

                const profileId = Array.isArray(id) ? id[0] : id;

                const foundUser = users.find(
                    (item: any) =>
                        String(item._id) === String(profileId)
                );

                if (foundUser) {
                    setUser(foundUser);

                    setEditForm({
                        name: foundUser.name || "",
                        about: foundUser.about || "",
                        tags: foundUser.tags || [],
                    });
                } else {
                    console.log(
                        "User was not found. Available users:",
                        users
                    );
                    setUser(null);
                }
            } catch (error) {
                console.log("Unable to load user:", error);
                toast.error("Unable to load user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getUser();
    }, [router.isReady, id]);

    const isOwnProfile =
        currentUser?._id === user?._id;

    const handleAddTag = () => {
        const trimmedTag = newTag.trim();

        if (
            trimmedTag &&
            !editForm.tags.includes(trimmedTag)
        ) {
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
            tags: editForm.tags.filter(
                (tag) => tag !== tagToRemove
            ),
        });
    };

    const handleSaveProfile = async () => {
        if (!user?._id) return;

        try {
            const res = await axiosInstance.patch(
                `/user/update/${user._id}`,
                {
                    name: editForm.name,
                    about: editForm.about,
                    tags: editForm.tags,
                }
            );

            setUser(res.data.data);
            setIsEditing(false);

            localStorage.setItem(
                "user",
                JSON.stringify(res.data.data)
            );

            setCurrentUser(res.data.data);

            toast.success("Profile updated successfully");
        } catch (error) {
            console.log(error);
            toast.error("Unable to update profile");
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="p-6">
                    Loading...
                </div>
            </MainLayout>
        );
    }

    if (!user) {
        return (
            <MainLayout>
                <div className="p-6">
                    User not found
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-6xl">

                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">

                    <Avatar className="w-32 h-32">
                        <AvatarFallback className="text-3xl">
                            {user.name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">

                        <div className="flex items-start justify-between gap-4">

                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {user.name}
                                </h1>

                                <div className="flex items-center text-sm text-gray-600 mt-3">
                                    <Calendar className="w-4 h-4 mr-2" />

                                    <span>
                                        Member since{" "}
                                        {new Date(
                                            user.joinDate
                                        )
                                            .toISOString()
                                            .split("T")[0]}
                                    </span>
                                </div>

                                <div className="flex items-center gap-6 mt-4">

                                    {/* Gold */}
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>

                                        <span className="font-semibold">
                                            5
                                        </span>

                                        <span className="text-gray-600 ml-1">
                                            gold badges
                                        </span>
                                    </div>

                                    {/* Silver */}
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>

                                        <span className="font-semibold">
                                            23
                                        </span>

                                        <span className="text-gray-600 ml-1">
                                            silver badges
                                        </span>
                                    </div>

                                    {/* Bronze */}
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-amber-600 rounded-full mr-2"></div>

                                        <span className="font-semibold">
                                            45
                                        </span>

                                        <span className="text-gray-600 ml-1">
                                            bronze badges
                                        </span>
                                    </div>

                                </div>
                            </div>

                            {/* Edit Profile */}
                            {isOwnProfile && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditForm({
                                            name: user.name || "",
                                            about: user.about || "",
                                            tags: user.tags || [],
                                        });

                                        setIsEditing(true);
                                    }}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            )}

                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="mb-6">
                    <div className="border border-gray-200 rounded-lg p-6">

                        <h3 className="text-lg font-semibold mb-6">
                            About
                        </h3>

                        <p className="text-gray-700">
                            {user.about ||
                                "No information provided."}
                        </p>

                    </div>
                </div>

                {/* Top Tags */}
                <div className="mb-6">
                    <div className="border border-gray-200 rounded-lg p-6">

                        <h3 className="text-lg font-semibold mb-6">
                            Top Tags
                        </h3>

                        <div className="flex flex-wrap gap-2">

                            {user.tags?.map(
                                (tag: string) => (
                                    <Badge key={tag}>
                                        {tag}
                                    </Badge>
                                )
                            )}

                        </div>

                    </div>
                </div>

                {/* Edit Profile Drawer */}
                {isEditing && (
                    <>
                        {/* Dark overlay */}
                        <div
                            className="fixed inset-0 z-40 bg-black/30"
                            onClick={() =>
                                setIsEditing(false)
                            }
                        />

                        {/* Drawer */}
                        <div className="fixed top-0 right-0 z-50 h-screen w-full max-w-md bg-white shadow-2xl overflow-y-auto">

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b">

                                <h2 className="text-xl font-bold">
                                    Edit Profile
                                </h2>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsEditing(false)
                                    }
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">

                                {/* Basic Information */}
                                <div>

                                    <h3 className="text-lg font-semibold mb-4">
                                        Basic Information
                                    </h3>

                                    <Label>
                                        Display Name
                                    </Label>

                                    <Input
                                        value={editForm.name}
                                        placeholder="Your display name"
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                name: e.target.value,
                                            })
                                        }
                                        className="mt-2"
                                    />

                                </div>

                                {/* About */}
                                <div>

                                    <h3 className="text-lg font-semibold mb-4">
                                        About
                                    </h3>

                                    <Label>
                                        About Me
                                    </Label>

                                    <Textarea
                                        value={editForm.about}
                                        placeholder="Tell us about yourself, your experience, and interests..."
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                about: e.target.value,
                                            })
                                        }
                                        className="mt-2 min-h-32"
                                    />

                                </div>

                                {/* Skills */}
                                <div>

                                    <h3 className="text-lg font-semibold mb-4">
                                        Skills & Technologies
                                    </h3>

                                    <Label>
                                        Tags
                                    </Label>

                                    <div className="flex gap-2 mt-2">

                                        <Input
                                            value={newTag}
                                            placeholder="Add a skill or technology"
                                            onChange={(e) =>
                                                setNewTag(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key ===
                                                    "Enter"
                                                ) {
                                                    e.preventDefault();
                                                    handleAddTag();
                                                }
                                            }}
                                        />

                                        <Button
                                            type="button"
                                            onClick={
                                                handleAddTag
                                            }
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-3"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>

                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">

                                        {editForm.tags.map(
                                            (tag: string) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="flex items-center gap-1"
                                                >
                                                    {tag}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveTag(
                                                                tag
                                                            )
                                                        }
                                                        className="ml-1 hover:text-red-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            )
                                        )}

                                    </div>

                                </div>

                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 border-t">

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setIsEditing(false)
                                    }
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        handleSaveProfile
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Save Changes
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