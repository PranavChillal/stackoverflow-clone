import user from "../models/auth.js";
import {
    getReputationPrivileges,
    REPUTATION_PRIVILEGES,
} from "../utils/reputation.js";

const PRIVILEGE_DETAILS = {
    canComment: {
        required: REPUTATION_PRIVILEGES.COMMENT,
        message: "You need at least 50 reputation to comment.",
    },

    canEditPosts: {
        required: REPUTATION_PRIVILEGES.EDIT_POSTS,
        message: "You need at least 100 reputation to edit posts.",
    },

    canVoteToClose: {
        required: REPUTATION_PRIVILEGES.CLOSE_QUESTIONS,
        message: "You need at least 250 reputation to close questions.",
    },

    canReportContent: {
        required: REPUTATION_PRIVILEGES.REPORT_CONTENT,
        message: "You need at least 500 reputation to report content.",
    },
};

export const requireReputation = (privilege) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({
                    message: "Authentication required.",
                });
            }

            const privilegeDetails =
                PRIVILEGE_DETAILS[privilege];

            if (!privilegeDetails) {
                return res.status(500).json({
                    message:
                        "Invalid reputation privilege configuration.",
                });
            }

            const currentUser = await user
                .findById(req.user.userId)
                .select("name reputation");

            if (!currentUser) {
                return res.status(404).json({
                    message: "User not found.",
                });
            }

            const reputation =
                Number(currentUser.reputation) || 0;

            const privileges =
                getReputationPrivileges(reputation);

            if (!privileges[privilege]) {
                return res.status(403).json({
                    message: privilegeDetails.message,
                    requiredReputation:
                        privilegeDetails.required,
                    currentReputation: reputation,
                    privilege,
                });
            }

            req.reputation = reputation;
            req.reputationPrivileges = privileges;

            next();
        } catch (error) {
            console.error(
                "Reputation privilege check error:",
                error
            );

            return res.status(500).json({
                message:
                    "Something went wrong while checking reputation privileges.",
            });
        }
    };
};