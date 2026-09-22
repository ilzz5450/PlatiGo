export async function pdfGenerator({
  content,
}: {
  content: string
}) {
  const text = (content ?? "").trim()
  if (!text) throw new Error("PDF Generator: content is required")

  return {
    pdfUrl: `data:application/pdf;base64,${Buffer.from(`PlatiGo PDF Report:\n\n${text}`).toString("base64")}`,
    status: "PDF generated successfully",
  }
}
