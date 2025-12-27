import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not configured")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Linda z Tuuli <linda@tuuli.cz>",
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error }
  }
}
