import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

console.log(
    "Razorpay Key ID loaded:",
    Boolean(process.env.RAZORPAY_KEY_ID),
    process.env.RAZORPAY_KEY_ID?.slice(0, 8)
);

console.log(
    "Razorpay Secret loaded:",
    Boolean(process.env.RAZORPAY_KEY_SECRET)
);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;