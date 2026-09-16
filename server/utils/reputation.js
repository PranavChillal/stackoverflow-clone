import user from "../models/auth.js";
import reputationHistory from "../models/reputationHistory.js";

export const updateReputation = async (
    userId,
    amount,
    reason
) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount === 0
    ) {
        throw new Error("Valid reputation amount is required");
    }

    if (!reason) {
        throw new Error("Reputation reason is required");
    }

    const foundUser = await user.findById(userId);

    if (!foundUser) {
        throw new Error("User not found");
    }

    const currentReputation = Number(foundUser.reputation) || 0;

    foundUser.reputation = Math.max(
        0,
        currentReputation + amount
    );

    await foundUser.save();

    await reputationHistory.create({
        userId,
        amount,
        reason,
        type: amount > 0 ? "earned" : "lost",
    });

    return foundUser;
};

export const REPUTATION_PRIVILEGES = {
    COMMENT: 50,
    EDIT_POSTS: 100,
    CLOSE_QUESTIONS: 250,
    REPORT_CONTENT: 500,
};

export const getReputationPrivileges = (reputation) => {
    const points = Number(reputation) || 0;

    return {
        canComment: points >= REPUTATION_PRIVILEGES.COMMENT,
        canEditPosts:
            points >= REPUTATION_PRIVILEGES.EDIT_POSTS,
        canVoteToClose:
            points >= REPUTATION_PRIVILEGES.CLOSE_QUESTIONS,
        canReportContent:
            points >= REPUTATION_PRIVILEGES.REPORT_CONTENT,
    };
};