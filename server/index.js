import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/question.js";
import reputationRoutes from "./routes/reputation.js";
import subscriptionRoutes from "./routes/subscription.js";
import bookmarkRoutes from "./routes/bookmark.js";
import postRoutes from "./routes/post.js";
import followRoutes from "./routes/follow.js";

dotenv.config();

const app = express();

app.use(
    express.json({
        limit: "30mb",
        extended: true,
    })
);

app.use(
    express.urlencoded({
        limit: "30mb",
        extended: true,
    })
);

const allowedOrigins = [
    process.env.FRONTEND_URL,
];

if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push(
        "http://localhost:3000"
    );
}

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        },
        credentials: true,
    })
);

app.use(cookieParser());

app.use(
    "/user",
    authRoutes
);

app.use(
    "/question",
    questionRoutes
);

app.use(
    "/reputation",
    reputationRoutes
);

app.use(
    "/subscription",
    subscriptionRoutes
);

app.use(
    "/bookmark",
    bookmarkRoutes
);

app.use(
    "/post",
    postRoutes
);

app.use(
    "/follow",
    followRoutes
);

app.get("/", (req, res) => {
    res.send(
        "Stackoverflow clone is running perfectly"
    );
});

const PORT =
    process.env.PORT || 5000;

const databaseurl =
    process.env.MONGODB_URL;

if (!databaseurl) {
    console.error(
        "❌ MONGODB_URL is not configured."
    );

    process.exit(1);
}

mongoose
    .connect(databaseurl)
    .then(() => {
        console.log(
            "✅ Connected to MongoDB"
        );

        app.listen(PORT, () => {
            console.log(
                `🚀 Server running on port ${PORT}`
            );
        });
    })
    .catch((err) => {
        console.error(
            "❌ MongoDB connection error:",
            err.message
        );

        process.exit(1);
    });