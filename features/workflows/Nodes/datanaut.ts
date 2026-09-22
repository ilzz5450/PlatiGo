export async function datanaut({
  dataInput,
  actionType,
}: {
  dataInput: string
  actionType: string
}) {
  const content = (dataInput ?? "").trim()
  const action = (actionType ?? "download-csv").trim().toLowerCase()

  const csvRows = content
    .split("\n")
    .map((line) => `"${line.replace(/"/g, '""')}"`)
    .join("\n")

  const csvHeader = `"Index","ExtractedData"\n`
  const lines = content.split("\n").filter(Boolean)
  const formattedCsv =
    lines.length > 0
      ? csvHeader + lines.map((l, i) => `"${i + 1}","${l.replace(/"/g, '""')}"`).join("\n")
      : `"Data"\n"${content.replace(/"/g, '""')}"`

  return {
    csv: formattedCsv,
    filename: `platigo-datanaut-${Date.now()}.csv`,
    status: `Processed data via DataNaut permutation: ${action}`,
  }
}
