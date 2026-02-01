import * as path from "node:path";
import { chromium } from "playwright";

const USER_DATA_DIR = path.resolve(
  import.meta.dirname,
  "../../.browser-data/google-maps",
);

async function main() {
  console.log("Launching Chrome with persistent context...");
  console.log(`User data will be saved to: ${USER_DATA_DIR}`);

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1280, height: 800 },
  });

  const page = context.pages()[0] || (await context.newPage());

  console.log("Navigating to Google Maps...");
  await page.goto("https://www.google.com/maps");

  console.log("");
  console.log("=".repeat(60));
  console.log("Please log in to your Google account in the browser.");
  console.log("Once logged in, close the browser window to save the session.");
  console.log("=".repeat(60));
  console.log("");

  // Wait for the browser to be closed by the user
  await context.waitForEvent("close");

  console.log("Session saved! You can now run pnpm run maps:add");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
