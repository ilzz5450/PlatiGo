export async function pdfGenerator({
  content,
}: {
  content?: string
}) {
  const text = (content ?? "PlatiGo Automated Report Output").trim()

  return {
    pdfUrl: `data:application/pdf;base64,${Buffer.from(`PlatiGo PDF Report:\n\n${text}`).toString("base64")}`,
    status: "PDF generated successfully",
  }
}
