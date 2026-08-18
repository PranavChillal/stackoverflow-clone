import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const Signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existinguser = await user.findOne({ email });

        if (existinguser) {
            return res.status(404).json({
                message: "User already exist",
            });
        }

        const hashpassword = await bcrypt.hash(password, 12);

        const newuser = await user.create({
            name,
            email,
            password: hashpassword,
        });

        res.status(200).json({
            data: newuser,
        });
    } catch (error) {
        res.status(500).json("something went wrong...");
        return;
    }
};

export const Login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existinguser = await user.findOne({ email });

        if (!existinguser) {
            return res.status(404).json({
                message: "User does not exist",
            });
        }

        const ispasswordcrct = await bcrypt.compare(
            password,
            existinguser.password
        );

        if (!ispasswordcrct) {
            return res.status(400).json({
                message: "Invalid password",
            });
        }

        res.status(200).json({
            data: existinguser,
        });
    } catch (error) {
        res.status(500).json("something went wrong...");
        return;
    }
};

export const getallusers = async (req, res) => {
    try {
        const alluser = await user.find();

        res.status(200).json({
            data: alluser,
        });
    } catch (error) {
        res.status(500).json("something went wrong...");
        return;
    }
};

export const updateprofile = async (req, res) => {
    const { id: _id } = req.params;
    const { name, about, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({
            message: "User unavailable",
        });
    }

    try {
        const updateprofile = await user.findByIdAndUpdate(
            _id,
            {
                $set: {
                    name,
                    about,
                    tags,
                },
            },
            { new: true }
        );

        res.status(200).json({
            data: updateprofile,
        });
    } catch (error) {
        res.status(500).json("something went wrong...");
        return;
    }
};