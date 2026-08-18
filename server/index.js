import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/question.js";

const app = express();

dotenv.config();

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use(cors());

app.use("/user", authRoutes);
app.use("/question", questionRoutes);

app.get("/", (req, res) => {
    res.send("Stackoverflow clone is running perfectly");
});

const PORT = process.env.PORT || 5000;
const databaseurl = process.env.MONGODB_URL;

mongoose
    .connect(databaseurl)
    .then(() => {
        console.log("✅ Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
    });