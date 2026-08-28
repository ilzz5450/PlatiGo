import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator"

const config = {
  dictionaries: [adjectives, animals],
  separator: "-",
  length: 2,
}

export function generateSlug() {
  return uniqueNamesGenerator(config)
}
// random slug generator for platipus platigo