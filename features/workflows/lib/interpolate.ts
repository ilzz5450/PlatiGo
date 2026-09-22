// Swaps `{{ nodeId.path }}` placeholders in a field for values pulled from
// this run's node outputs (keyed by node id). Pure — the caller supplies the
// outputs map. A placeholder that points at nothing becomes "", and one that
// lands on an object/array drops in its JSON so it survives inside text.
export type NodeOutputs = Record<string, unknown>

const PLACEHOLDER = /\{\{\s*([^}]+?)\s*\}\}/g

// Walks a dotted/bracketed path (e.g. `items[0].name`) off the outputs map,
// treating the first segment as the node id. Returns undefined the moment the
// path leaves an object rather than throwing.
function getByPath(root: NodeOutputs, path: string): unknown {
  const keys = path
    .replace(/\[(\w+)\]/g, ".$1") // items[0] -> items.0
    .split(".")
    .filter(Boolean)

  return keys.reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[key]
  }, root)
}

// Static fallback map of `nodeId.path` -> the value the user *typed* into a
// node. Runtime outputs win when they exist; if a referenced node hasn't
// produced output yet (or an upstream step silently produced none), we fall
// back to the stored value so `{{ id.url }}` resolves to what the canvas shows.
export type StaticValues = Record<string, string | undefined>

export function interpolate({
  text,
  outputs,
  staticValues,
}: {
  text: string
  outputs: NodeOutputs
  staticValues?: StaticValues
}): string {
  if (text == null) return ""
  return text.replace(PLACEHOLDER, (_match, expr: string) => {
    const path = expr.trim()
    const runtimeValue = getByPath(outputs, path)
    const value = runtimeValue !== undefined ? runtimeValue : staticValues?.[path]
    if (value == null) return ""
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }
    return String(value)
  })
}