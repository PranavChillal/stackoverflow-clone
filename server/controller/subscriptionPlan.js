import razorpay from "../utils/razorpay.js";

export const createSubscriptionPlans = async (req, res) => {
    try {
        const plans = await razorpay.plans.all();

        res.status(200).json({
            data: plans,
        });
    } catch (error) {
        console.log("Razorpay plans error:", error);

        res.status(500).json({
            message: "Unable to access Razorpay plans",
        });
    }
};