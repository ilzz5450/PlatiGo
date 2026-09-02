import { Resend } from "resend"



/**
 * Singleton Resend client.
 *
 * Usage (server-side only — never call from the browser):
 *
 *   import { resend } from "@/lib/resend"
 *
 *   const { data, error } = await resend.emails.send({
 *     from: "Platigo <noreply@yourdomain.com>",
 *     to: ["user@example.com"],
 *     subject: "Hello!",
 *     html: "<p>Hello from Platigo</p>",
 *   })
 *
 *   if (error) {
 *     console.error("Resend error:", error.message)
 *   }
 *
 * NOTE: The Node.js SDK never throws on API errors — always check `error`
 * explicitly instead of wrapping in try/catch.
 */
export const resend = new Resend(process.env.RESEND_API_KEY ?? "")
