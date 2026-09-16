import mongoose from "mongoose";
import user from "../models/auth.js";
import reputationHistory from "../models/reputationHistory.js";
import reputationTransfer from "../models/reputationTransfer.js";

export const transferReputation = async (req, res) => {
    const senderId = req.user.userId;
    const { receiverId, amount, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({
            message: "Receiver unavailable",
        });
    }

    if (receiverId === senderId) {
        return res.status(400).json({
            message: "You cannot transfer reputation to yourself",
        });
    }

    const transferAmount = Number(amount);

    if (
        !Number.isInteger(transferAmount) ||
        transferAmount <= 0
    ) {
        return res.status(400).json({
            message: "Transfer amount must be a positive whole number",
        });
    }

    if (transferAmount > 50) {
        return res.status(400).json({
            message:
                "You can transfer a maximum of 50 reputation points per transaction",
        });
    }

    if (!reason || !reason.trim()) {
        return res.status(400).json({
            message: "Transfer reason is required",
        });
    }

    try {
        const sender = await user.findById(senderId);
        const receiver = await user.findById(receiverId);

        if (!sender) {
            return res.status(404).json({
                message: "Sender not found",
            });
        }

        if (!receiver) {
            return res.status(404).json({
                message: "Receiver not found",
            });
        }

        // Sender must have more than 50 reputation.
        if (sender.reputation <= 50) {
            return res.status(403).json({
                message:
                    "You must have more than 50 reputation points to transfer reputation",
            });
        }

        if (sender.reputation < transferAmount) {
            return res.status(400).json({
                message: "Insufficient reputation points",
            });
        }

        // Calculate the beginning of today.
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Calculate the end of today.
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayTransfers =
            await reputationTransfer.find({
                senderId,
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
            });

        const transferredToday = todayTransfers.reduce(
            (total, transfer) =>
                total + transfer.amount,
            0
        );

        if (transferredToday + transferAmount > 100) {
            return res.status(400).json({
                message:
                    "You can transfer a maximum of 100 reputation points per day",
            });
        }

        // Update both users.
        sender.reputation -= transferAmount;
        receiver.reputation += transferAmount;

        await sender.save();
        await receiver.save();

        // Record the reputation changes.
        await reputationHistory.create([
            {
                userId: sender._id,
                amount: -transferAmount,
                reason: `Reputation transferred to ${receiver.name}: ${reason.trim()}`,
                type: "lost",
            },
            {
                userId: receiver._id,
                amount: transferAmount,
                reason: `Reputation received from ${sender.name}: ${reason.trim()}`,
                type: "earned",
            },
        ]);

        // Record the transfer itself.
        const transfer =
            await reputationTransfer.create({
                senderId: sender._id,
                receiverId: receiver._id,
                amount: transferAmount,
                reason: reason.trim(),
            });

        res.status(200).json({
            message: "Reputation transferred successfully",
            data: {
                transfer,
                senderReputation: sender.reputation,
                receiverReputation: receiver.reputation,
            },
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};

export const getMyReputationTransfers = async (
    req,
    res
) => {
    const userId = req.user.userId;

    try {
        const transfers =
            await reputationTransfer
                .find({
                    $or: [
                        { senderId: userId },
                        { receiverId: userId },
                    ],
                })
                .populate(
                    "senderId",
                    "name email"
                )
                .populate(
                    "receiverId",
                    "name email"
                )
                .sort({
                    createdAt: -1,
                });

        res.status(200).json({
            data: transfers,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong...",
        });
    }
};