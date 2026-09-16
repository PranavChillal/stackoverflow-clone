import subscription from "../models/subscription.js";

export const SUBSCRIPTION_PLANS = {
    free: {
        name: "Free",
        price: 0,
        dailyQuestionLimit: 1,
        badge: null,
        advancedSearch: false,
        prioritySupport: false,
        enhancedProfileVisibility: false,
        unlimitedBookmarks: false,
        highestSearchPriority: false,
        featuredProfileVisibility: false,
        exclusiveCommunityFeatures: false,
    },

    bronze: {
        name: "Bronze",
        price: 99,
        dailyQuestionLimit: 5,
        badge: "Bronze",
        advancedSearch: true,
        prioritySupport: false,
        enhancedProfileVisibility: false,
        unlimitedBookmarks: false,
        highestSearchPriority: false,
        featuredProfileVisibility: false,
        exclusiveCommunityFeatures: false,
    },

    silver: {
        name: "Silver",
        price: 299,
        dailyQuestionLimit: 15,
        badge: "Silver",
        advancedSearch: true,
        prioritySupport: true,
        enhancedProfileVisibility: true,
        unlimitedBookmarks: true,
        highestSearchPriority: false,
        featuredProfileVisibility: false,
        exclusiveCommunityFeatures: false,
    },

    gold: {
        name: "Gold",
        price: 999,
        dailyQuestionLimit: Infinity,
        badge: "Gold",
        advancedSearch: true,
        prioritySupport: true,
        enhancedProfileVisibility: true,
        unlimitedBookmarks: true,
        highestSearchPriority: true,
        featuredProfileVisibility: true,
        exclusiveCommunityFeatures: true,
    },
};

export const getOrCreateSubscription = async (
    userId,
    userData = {}
) => {
    const existingSubscription =
        await subscription.findOne({ userId });

    if (existingSubscription) {
        return existingSubscription;
    }

    try {
        return await subscription.create({
            userId,
            plan: "free",
            status: "active",
            amount: 0,
            currency: "INR",
            startDate: new Date(),
            billingDetails: {
                name: userData.name || "",
                email: userData.email || "",
            },
        });
    } catch (error) {
        /*
         * Another request may have created the subscription
         * between findOne() and create().
         *
         * MongoDB's unique userId index prevents the duplicate.
         * In that case, simply return the subscription that
         * already exists.
         */
        if (error?.code === 11000) {
            const subscriptionAlreadyCreated =
                await subscription.findOne({ userId });

            if (subscriptionAlreadyCreated) {
                return subscriptionAlreadyCreated;
            }
        }

        throw error;
    }
};

export const getPlanDetails = (plan) => {
    return (
        SUBSCRIPTION_PLANS[plan] ||
        SUBSCRIPTION_PLANS.free
    );
};

export const getDailyQuestionLimit = (plan) => {
    return getPlanDetails(plan)
        .dailyQuestionLimit;
};