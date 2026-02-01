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

  console.log(`Writing to ${OUTPUT_FILE}...`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, html, "utf-8");

  console.log(`Done! Saved ${html.length} bytes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
