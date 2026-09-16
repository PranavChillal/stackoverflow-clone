import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter =
    nodemailer.createTransport({
        service: "gmail",

        auth: {
            user:
                process.env.EMAIL_USER,

            pass:
                process.env.EMAIL_PASSWORD,
        },
    });

/*
|--------------------------------------------------------------------------
| Subscription Confirmation Email
|--------------------------------------------------------------------------
*/

export const sendSubscriptionConfirmationEmail =
    async ({
        to,
        name,
        plan,
        amount,
        currency,
        invoiceNumber,
        paymentId,
        renewalDate,
        invoiceBuffer,
    }) => {
        const renewalDateFormatted =
            new Date(
                renewalDate
            ).toLocaleDateString(
                "en-IN"
            );

        const mailOptions = {
            from: `"CodeQuest" <${process.env.EMAIL_USER}>`,

            to,

            subject:
                `Subscription Activated - ${plan} Plan`,

            text: `
Hello ${name || "User"},

Your CodeQuest subscription has been successfully activated.

Subscription Details
--------------------
Plan: ${plan}
Amount: ${currency} ${amount}
Invoice Number: ${invoiceNumber}
Payment ID: ${paymentId}
Renewal Date: ${renewalDateFormatted}

Your invoice is attached to this email.

Thank you for subscribing to CodeQuest.

Regards,
CodeQuest Team
            `.trim(),

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #222;
                ">
                    <h2>
                        Subscription Activated
                    </h2>

                    <p>
                        Hello ${
                            name || "User"
                        },
                    </p>

                    <p>
                        Your CodeQuest subscription
                        has been successfully activated.
                    </p>

                    <div style="
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                    ">
                        <h3>
                            Subscription Details
                        </h3>

                        <p>
                            <strong>Plan:</strong>
                            ${plan}
                        </p>

                        <p>
                            <strong>Amount:</strong>
                            ${currency} ${amount}
                        </p>

                        <p>
                            <strong>Invoice Number:</strong>
                            ${invoiceNumber}
                        </p>

                        <p>
                            <strong>Payment ID:</strong>
                            ${paymentId}
                        </p>

                        <p>
                            <strong>Renewal Date:</strong>
                            ${renewalDateFormatted}
                        </p>
                    </div>

                    <p>
                        Your invoice is attached
                        to this email.
                    </p>

                    <p>
                        Thank you for subscribing
                        to CodeQuest!
                    </p>

                    <p>
                        Regards,<br />
                        CodeQuest Team
                    </p>
                </div>
            `,

            attachments: [
                {
                    filename:
                        `${invoiceNumber}.pdf`,

                    content:
                        invoiceBuffer,

                    contentType:
                        "application/pdf",
                },
            ],
        };

        await transporter.sendMail(
            mailOptions
        );
    };

/*
|--------------------------------------------------------------------------
| Password Reset Email
|--------------------------------------------------------------------------
*/

export const sendPasswordResetEmail =
    async ({
        to,
        name,
        password,
    }) => {
        const mailOptions = {
            from: `"CodeQuest" <${process.env.EMAIL_USER}>`,

            to,

            subject:
                "CodeQuest Password Reset",

            text: `
Hello ${name || "User"},

Your CodeQuest password has been reset successfully.

Your new temporary password is:

${password}

Please log in using this password and change it to a new password as soon as possible.

For your security, do not share this password with anyone.

If you did not request a password reset, please secure your CodeQuest account immediately.

Regards,
CodeQuest Team
            `.trim(),

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #222;
                ">
                    <h2>
                        Password Reset
                    </h2>

                    <p>
                        Hello ${
                            name || "User"
                        },
                    </p>

                    <p>
                        Your CodeQuest password
                        has been reset successfully.
                    </p>

                    <div style="
                        background: #f3f4f6;
                        border-radius: 10px;
                        padding: 24px;
                        margin: 24px 0;
                        text-align: center;
                    ">
                        <p style="
                            margin: 0 0 12px;
                            color: #6b7280;
                        ">
                            Your New Temporary Password
                        </p>

                        <div style="
                            font-size: 24px;
                            font-weight: bold;
                            letter-spacing: 2px;
                            word-break: break-all;
                            color: #111827;
                        ">
                            ${password}
                        </div>
                    </div>

                    <p>
                        Please log in using this
                        password and change it to a
                        new password as soon as possible.
                    </p>

                    <p style="
                        color: #b91c1c;
                        font-weight: 600;
                    ">
                        For your security, do not share
                        this password with anyone.
                    </p>

                    <p style="
                        color: #6b7280;
                        font-size: 14px;
                    ">
                        If you did not request a password
                        reset, please secure your CodeQuest
                        account immediately.
                    </p>

                    <p>
                        Regards,<br />
                        CodeQuest Team
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(
            mailOptions
        );
    };

/*
|--------------------------------------------------------------------------
| Language Verification OTP Email
|--------------------------------------------------------------------------
*/

export const sendLanguageOTPEmail =
    async ({
        to,
        name,
        otp,
        language,
    }) => {
        const mailOptions = {
            from: `"CodeQuest" <${process.env.EMAIL_USER}>`,

            to,

            subject:
                "CodeQuest Language Verification OTP",

            text: `
Hello ${name || "User"},

You requested to change your CodeQuest language to ${language}.

Your verification OTP is:

${otp}

This OTP is valid for 10 minutes.

If you did not request this language change, please ignore this email.

Regards,
CodeQuest Team
            `.trim(),

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #222;
                ">
                    <h2>
                        Verify Your Language Change
                    </h2>

                    <p>
                        Hello ${
                            name || "User"
                        },
                    </p>

                    <p>
                        You requested to change
                        your CodeQuest language to
                        <strong>${language}</strong>.
                    </p>

                    <div style="
                        background: #f3f4f6;
                        border-radius: 10px;
                        padding: 20px;
                        margin: 24px 0;
                        text-align: center;
                    ">
                        <p style="
                            margin: 0 0 10px;
                            color: #6b7280;
                        ">
                            Your verification code
                        </p>

                        <div style="
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            color: #2563eb;
                        ">
                            ${otp}
                        </div>
                    </div>

                    <p>
                        This OTP is valid for
                        <strong>10 minutes</strong>.
                    </p>

                    <p style="
                        color: #6b7280;
                        font-size: 14px;
                    ">
                        If you did not request this
                        language change, you can safely
                        ignore this email.
                    </p>

                    <p>
                        Regards,<br />
                        CodeQuest Team
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(
            mailOptions
        );
    };

/*
|--------------------------------------------------------------------------
| New Device Login Email
|--------------------------------------------------------------------------
*/

export const sendNewDeviceLoginEmail =
    async ({
        to,
        name,
        browser,
        operatingSystem,
        deviceType,
        ipAddress,
        location,
        loginAt,
    }) => {
        const loginDateFormatted =
            new Date(
                loginAt
            ).toLocaleString(
                "en-IN"
            );

        const safeLocation =
            location ||
            "Location unavailable";

        const mailOptions = {
            from: `"CodeQuest" <${process.env.EMAIL_USER}>`,

            to,

            subject:
                "New Device Login - CodeQuest",

            text: `
Hello ${name || "User"},

A new device was used to sign in to your CodeQuest account.

Login Details
-------------
Browser: ${browser || "Unknown"}
Operating System: ${
                operatingSystem ||
                "Unknown"
            }
Device: ${
                deviceType ||
                "Unknown"
            }
IP Address: ${
                ipAddress ||
                "Unavailable"
            }
Location: ${safeLocation}
Login Time: ${loginDateFormatted}

If this was you, no action is required.

If you do not recognize this login, please sign out of the session from your CodeQuest Active Sessions page and secure your account.

Regards,
CodeQuest Team
            `.trim(),

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #222;
                ">
                    <h2>
                        New Device Login
                    </h2>

                    <p>
                        Hello ${
                            name || "User"
                        },
                    </p>

                    <p>
                        A new device was used to sign in
                        to your CodeQuest account.
                    </p>

                    <div style="
                        border: 1px solid #e5e7eb;
                        border-radius: 10px;
                        padding: 20px;
                        margin: 20px 0;
                    ">
                        <h3>
                            Login Details
                        </h3>

                        <p>
                            <strong>Browser:</strong>
                            ${
                                browser ||
                                "Unknown"
                            }
                        </p>

                        <p>
                            <strong>Operating System:</strong>
                            ${
                                operatingSystem ||
                                "Unknown"
                            }
                        </p>

                        <p>
                            <strong>Device:</strong>
                            ${
                                deviceType ||
                                "Unknown"
                            }
                        </p>

                        <p>
                            <strong>IP Address:</strong>
                            ${
                                ipAddress ||
                                "Unavailable"
                            }
                        </p>

                        <p>
                            <strong>Location:</strong>
                            ${safeLocation}
                        </p>

                        <p>
                            <strong>Login Time:</strong>
                            ${loginDateFormatted}
                        </p>
                    </div>

                    <p>
                        If this was you, no action is required.
                    </p>

                    <p style="
                        color: #b91c1c;
                        font-weight: 600;
                    ">
                        If you do not recognize this login,
                        please sign out of the session from
                        your CodeQuest Active Sessions page
                        and secure your account.
                    </p>

                    <p>
                        Regards,<br />
                        CodeQuest Team
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(
            mailOptions
        );
    };

/*
|--------------------------------------------------------------------------
| New Device Login OTP Email
|--------------------------------------------------------------------------
*/

export const sendLoginOTPEmail =
    async ({
        to,
        name,
        otp,
        browser,
        operatingSystem,
        deviceType,
        ipAddress,
    }) => {
        const mailOptions = {
            from: `"CodeQuest" <${process.env.EMAIL_USER}>`,

            to,

            subject:
                "CodeQuest Login Verification OTP",

            text: `
Hello ${name || "User"},

We detected a login from an unrecognized device on your CodeQuest account.

To complete this login, enter the following verification code:

${otp}

This OTP is valid for 10 minutes.

Login Details
-------------
Browser: ${browser || "Unknown"}
Operating System: ${
                operatingSystem ||
                "Unknown"
            }
Device: ${
                deviceType ||
                "Unknown"
            }
IP Address: ${
                ipAddress ||
                "Unavailable"
            }

If you did not attempt to log in, do not share this OTP and revoke the suspicious session from your CodeQuest Active Sessions page.

Regards,
CodeQuest Team
            `.trim(),

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #222;
                ">
                    <h2>
                        Verify Your Login
                    </h2>

                    <p>
                        Hello ${
                            name || "User"
                        },
                    </p>

                    <p>
                        We detected a login from an
                        unrecognized device on your
                        CodeQuest account.
                    </p>

                    <p>
                        Enter the verification code
                        below to complete your login.
                    </p>

                    <div style="
                        background: #f3f4f6;
                        border-radius: 10px;
                        padding: 24px;
                        margin: 24px 0;
                        text-align: center;
                    ">
                        <p style="
                            margin: 0 0 10px;
                            color: #6b7280;
                        ">
                            Verification Code
                        </p>

                        <div style="
                            font-size: 34px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            color: #2563eb;
                        ">
                            ${otp}
                        </div>
                    </div>

                    <p>
                        This OTP is valid for
                        <strong>10 minutes</strong>.
                    </p>

                    <div style="
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 20px 0;
                    ">
                        <h3>
                            Login Details
                        </h3>

                        <p>
                            <strong>Browser:</strong>
                            ${
                                browser ||
                                "Unknown"
                            }
                        </p>

                        <p>
                            <strong>Operating System:</strong>
                            ${
                                operatingSystem ||
                                "Unknown"
                            }
                        </p>

                        <p>
                            <strong>Device:</strong>
                            ${
                                deviceType ||
                                "Unknown"
                            }
                        </p>

                        <p>
                            <strong>IP Address:</strong>
                            ${
                                ipAddress ||
                                "Unavailable"
                            }
                        </p>
                    </div>

                    <p style="
                        color: #b91c1c;
                        font-weight: 600;
                    ">
                        If you did not attempt this login,
                        do not share this OTP and revoke
                        the suspicious session from your
                        CodeQuest Active Sessions page.
                    </p>

                    <p>
                        Regards,<br />
                        CodeQuest Team
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(
            mailOptions
        );
    };