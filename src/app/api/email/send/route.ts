import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("----- EMAIL API CALLED -----");
  console.log("SENDGRID_API_KEY exists?", !!process.env.SENDGRID_API_KEY);
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
  console.log("EMAIL_REPLY_TO:", process.env.EMAIL_REPLY_TO);

  try {
    const { to, subject, html } = await req.json();

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    const replyTo = process.env.EMAIL_REPLY_TO;

    if (!apiKey || !fromEmail) {
      throw new Error("Missing required environment variables");
    }

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: { email: fromEmail, name: "Chess Klub Team" },
        reply_to: { email: replyTo },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("SendGrid error:", error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
