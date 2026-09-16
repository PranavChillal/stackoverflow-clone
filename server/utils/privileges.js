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