import * as fs from "node:fs";
import * as path from "node:path";

const URL = "https://yoinoyoi.com/shop/";
const OUTPUT_FILE = path.resolve(import.meta.dirname, "../../input/shop.html");

async function main() {
  console.log(`Fetching ${URL}...`);

  const response = await fetch(URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  // Normalize line endings to LF
  const normalizedHtml = html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  console.log(`Writing to ${OUTPUT_FILE}...`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, normalizedHtml, "utf-8");

  console.log(`Done! Saved ${normalizedHtml.length} bytes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
