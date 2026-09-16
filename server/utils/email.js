import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

/*
|--------------------------------------------------------------------------
| Gmail API Configuration
|--------------------------------------------------------------------------
*/

const gmailClientId =
    process.env.GMAIL_CLIENT_ID;

const gmailClientSecret =
    process.env.GMAIL_CLIENT_SECRET;

const gmailRefreshToken =
    process.env.GMAIL_REFRESH_TOKEN;

const emailUser =
    process.env.EMAIL_USER;

if (
    !gmailClientId ||
    !gmailClientSecret ||
    !gmailRefreshToken ||
    !emailUser
) {
    console.warn(
        "Gmail API environment variables are incomplete."
    );
}

const oauth2Client =
    new google.auth.OAuth2(
        gmailClientId,
        gmailClientSecret,
        "http://localhost:3000/oauth2callback"
    );

oauth2Client.setCredentials({
    refresh_token:
        gmailRefreshToken,
});

const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
});

/*
|--------------------------------------------------------------------------
| MIME Helpers
|--------------------------------------------------------------------------
*/

const encodeBase64Url = (value) => {
    return Buffer.from(value)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
};

const wrapBase64 = (value) => {
    return (
        value
            .match(/.{1,76}/g)
            ?.join("\r\n") || ""
    );
};

const sanitizeHeader = (value) => {
    return String(value || "")
        .replace(/\r/g, "")
        .replace(/\n/g, "");
};

const parseSender = (value) => {
    const senderValue = String(
        value || ""
    ).trim();

    const match = senderValue.match(
        /^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/
    );

    if (match) {
        return {
            name:
                sanitizeHeader(
                    match[1]
                ) || "CodeQuest",

            email:
                sanitizeHeader(
                    match[2]
                ) || emailUser,
        };
    }

    return {
        name: "CodeQuest",
        email:
            sanitizeHeader(
                senderValue
            ) || emailUser,
    };
};

const normalizeRecipients = (to) => {
    if (Array.isArray(to)) {
        return to
            .map((recipient) => {
                if (
                    typeof recipient ===
                    "string"
                ) {
                    return recipient.trim();
                }

                if (
                    recipient &&
                    typeof recipient.email ===
                        "string"
                ) {
                    return recipient.email.trim();
                }

                return "";
            })
            .filter(Boolean);
    }

    return String(to || "")
        .split(",")
        .map((recipient) =>
            recipient.trim()
        )
        .filter(Boolean);
};

const buildAlternativePart = ({
    text,
    html,
}) => {
    const hasText = Boolean(
        text &&
            String(text).trim()
    );

    const hasHtml = Boolean(
        html &&
            String(html).trim()
    );

    if (hasText && hasHtml) {
        const boundary =
            `CodeQuestAlt_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`;

        let body = "";

        body +=
            `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
        body += "\r\n";

        body +=
            `--${boundary}\r\n`;
        body +=
            "Content-Type: text/plain; charset=UTF-8\r\n";
        body +=
            "Content-Transfer-Encoding: 8bit\r\n";
        body += "\r\n";
        body += `${text}\r\n`;
        body += "\r\n";

        body +=
            `--${boundary}\r\n`;
        body +=
            "Content-Type: text/html; charset=UTF-8\r\n";
        body +=
            "Content-Transfer-Encoding: 8bit\r\n";
        body += "\r\n";
        body += `${html}\r\n`;
        body += "\r\n";

        body +=
            `--${boundary}--\r\n`;

        return body;
    }

    if (hasHtml) {
        return [
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: 8bit",
            "",
            String(html),
        ].join("\r\n");
    }

    return [
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        String(text || ""),
    ].join("\r\n");
};

const createMimeMessage = ({
    from,
    to,
    subject,
    text,
    html,
    attachments = [],
}) => {
    const sender =
        parseSender(from);

    const recipients =
        normalizeRecipients(to);

    if (!sender.email) {
        throw new Error(
            "Sender email is required"
        );
    }

    if (!recipients.length) {
        throw new Error(
            "Recipient email is required"
        );
    }

    const safeSubject =
        sanitizeHeader(subject);

    const hasAttachments =
        Array.isArray(attachments) &&
        attachments.length > 0;

    let mime = "";

    mime += `From: ${sender.name} <${sender.email}>\r\n`;
    mime += `To: ${recipients.join(", ")}\r\n`;
    mime += `Subject: ${safeSubject}\r\n`;
    mime += "MIME-Version: 1.0\r\n";

    /*
    |--------------------------------------------------------------------------
    | No Attachments
    |--------------------------------------------------------------------------
    */

    if (!hasAttachments) {
        const hasText = Boolean(
            text &&
                String(text).trim()
        );

        const hasHtml = Boolean(
            html &&
                String(html).trim()
        );

        if (hasText && hasHtml) {
            const boundary =
                `CodeQuestAlt_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2)}`;

            mime +=
                `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
            mime += "\r\n";

            mime +=
                `--${boundary}\r\n`;
            mime +=
                "Content-Type: text/plain; charset=UTF-8\r\n";
            mime +=
                "Content-Transfer-Encoding: 8bit\r\n";
            mime += "\r\n";
            mime += `${text}\r\n`;
            mime += "\r\n";

            mime +=
                `--${boundary}\r\n`;
            mime +=
                "Content-Type: text/html; charset=UTF-8\r\n";
            mime +=
                "Content-Transfer-Encoding: 8bit\r\n";
            mime += "\r\n";
            mime += `${html}\r\n`;
            mime += "\r\n";

            mime +=
                `--${boundary}--\r\n`;

            return mime;
        }

        if (hasHtml) {
            mime +=
                "Content-Type: text/html; charset=UTF-8\r\n";
            mime +=
                "Content-Transfer-Encoding: 8bit\r\n";
            mime += "\r\n";
            mime += `${html || ""}\r\n`;

            return mime;
        }

        mime +=
            "Content-Type: text/plain; charset=UTF-8\r\n";
        mime +=
            "Content-Transfer-Encoding: 8bit\r\n";
        mime += "\r\n";
        mime += `${text || ""}\r\n`;

        return mime;
    }

    /*
    |--------------------------------------------------------------------------
    | Attachments
    |--------------------------------------------------------------------------
    */

    const outerBoundary =
        `CodeQuestMixed_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;

    mime +=
        `Content-Type: multipart/mixed; boundary="${outerBoundary}"\r\n`;
    mime += "\r\n";

    /*
    |--------------------------------------------------------------------------
    | Main Message Part
    |--------------------------------------------------------------------------
    */

    const hasText = Boolean(
        text &&
            String(text).trim()
    );

    const hasHtml = Boolean(
        html &&
            String(html).trim()
    );

    mime +=
        `--${outerBoundary}\r\n`;

    if (hasText && hasHtml) {
        const alternativeBoundary =
            `CodeQuestAlt_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`;

        mime +=
            `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"\r\n`;
        mime += "\r\n";

        mime +=
            `--${alternativeBoundary}\r\n`;
        mime +=
            "Content-Type: text/plain; charset=UTF-8\r\n";
        mime +=
            "Content-Transfer-Encoding: 8bit\r\n";
        mime += "\r\n";
        mime += `${text}\r\n`;
        mime += "\r\n";

        mime +=
            `--${alternativeBoundary}\r\n`;
        mime +=
            "Content-Type: text/html; charset=UTF-8\r\n";
        mime +=
            "Content-Transfer-Encoding: 8bit\r\n";
        mime += "\r\n";
        mime += `${html}\r\n`;
        mime += "\r\n";

        mime +=
            `--${alternativeBoundary}--\r\n`;
    } else if (hasHtml) {
        mime +=
            "Content-Type: text/html; charset=UTF-8\r\n";
        mime +=
            "Content-Transfer-Encoding: 8bit\r\n";
        mime += "\r\n";
        mime += `${html}\r\n`;
    } else {
        mime +=
            "Content-Type: text/plain; charset=UTF-8\r\n";
        mime +=
            "Content-Transfer-Encoding: 8bit\r\n";
        mime += "\r\n";
        mime += `${text || ""}\r\n`;
    }

    /*
    |--------------------------------------------------------------------------
    | Attachment Parts
    |--------------------------------------------------------------------------
    */

    for (const attachment of attachments) {
        const filename =
            sanitizeHeader(
                attachment.filename ||
                    "attachment"
            );

        const contentType =
            sanitizeHeader(
                attachment.contentType ||
                    "application/octet-stream"
            );

        const content =
            Buffer.isBuffer(
                attachment.content
            )
                ? attachment.content
                : Buffer.from(
                      attachment.content ||
                          ""
                  );

        const encodedContent =
            wrapBase64(
                content.toString(
                    "base64"
                )
            );

        mime += "\r\n";
        mime +=
            `--${outerBoundary}\r\n`;

        mime +=
            `Content-Type: ${contentType}; name="${filename}"\r\n`;

        mime +=
            "Content-Transfer-Encoding: base64\r\n";

        mime +=
            `Content-Disposition: attachment; filename="${filename}"\r\n`;

        mime += "\r\n";
        mime += `${encodedContent}\r\n`;
    }

    mime +=
        `\r\n--${outerBoundary}--\r\n`;

    return mime;
};

/*
|--------------------------------------------------------------------------
| Send Email Through Gmail API
|--------------------------------------------------------------------------
*/

const sendEmail = async ({
    from,
    to,
    subject,
    text,
    html,
    attachments = [],
}) => {
    if (
        !gmailClientId ||
        !gmailClientSecret ||
        !gmailRefreshToken ||
        !emailUser
    ) {
        throw new Error(
            "Gmail API environment variables are not configured"
        );
    }

    const recipients =
        normalizeRecipients(to);

    if (!recipients.length) {
        throw new Error(
            "Email recipient is required"
        );
    }

    const mimeMessage =
        createMimeMessage({
            from:
                from ||
                `"CodeQuest" <${emailUser}>`,
            to: recipients,
            subject:
                subject ||
                "CodeQuest Notification",
            text,
            html,
            attachments,
        });

    const raw =
        encodeBase64Url(
            mimeMessage
        );

    const response =
        await gmail.users.messages.send({
            userId: "me",

            requestBody: {
                raw,
            },
        });

    return response.data;
};

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

        await sendEmail({
            from: `"CodeQuest" <${emailUser}>`,

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
        });
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
        await sendEmail({
            from: `"CodeQuest" <${emailUser}>`,

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
        });
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
        await sendEmail({
            from: `"CodeQuest" <${emailUser}>`,

            to,

            subject:
                "CodeQuest Language Verification OTP",

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
        });
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

        await sendEmail({
            from: `"CodeQuest" <${emailUser}>`,

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
        });
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
        await sendEmail({
            from: `"CodeQuest" <${emailUser}>`,

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
        });
    };