import * as fs from "node:fs";
import * as path from "node:path";
import { chromium, type Page } from "playwright";
import type { Shop } from "../types/shop.js";

const USER_DATA_DIR = path.resolve(
  import.meta.dirname,
  "../../.browser-data/google-maps",
);
const SHOPS_JSON = path.resolve(import.meta.dirname, "../../output/shops.json");
const PROGRESS_FILE = path.resolve(
  import.meta.dirname,
  "../../output/maps-progress.json",
);

// List name to save shops to
const LIST_NAME = "酔いの宵 2026";

// Delay between operations (ms) - be gentle to avoid detection
const DELAY_BETWEEN_SHOPS = 3000;
const DELAY_BETWEEN_ACTIONS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadProgress(): Promise<Set<number>> {
  try {
    const data = fs.readFileSync(PROGRESS_FILE, "utf-8");
    const completed = JSON.parse(data) as number[];
    return new Set(completed);
  } catch {
    return new Set();
  }
}

function saveProgress(completed: Set<number>): void {
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify([...completed], null, 2),
    "utf-8",
  );
}

async function searchAndSaveShop(
  page: Page,
  shop: Shop,
  listName: string,
): Promise<boolean> {
  const searchQuery = `${shop.name} 東京都${shop.address}`;
  console.log(`  Searching: ${searchQuery}`);

  // Type in search box
  const searchBox = page.locator('input[name="q"], #searchboxinput');
  await searchBox.fill(searchQuery);
  await searchBox.press("Enter");

  // Wait for results to load
  await delay(DELAY_BETWEEN_ACTIONS * 2);

  // Look for the save button
  try {
    // Wait for place details panel
    await page.waitForSelector('[data-value="Save"]', { timeout: 10000 });

    // Click save button
    await page.click('[data-value="Save"]');
    await delay(DELAY_BETWEEN_ACTIONS);

    // Look for the list or create new one
    const listButton = page.locator(`text="${listName}"`).first();
    if (await listButton.isVisible()) {
      await listButton.click();
    } else {
      // Create new list if it doesn't exist
      console.log(`  Creating new list: ${listName}`);
      await page.click('text="New list"');
      await delay(DELAY_BETWEEN_ACTIONS);
      await page.fill('input[aria-label="List name"]', listName);
      await page.click('button:has-text("Create")');
    }

    await delay(DELAY_BETWEEN_ACTIONS);
    console.log(`  ✓ Saved to list!`);
    return true;
  } catch (error) {
    console.log(`  ✗ Failed to save: ${error}`);
    return false;
  }
}

async function main() {
  // Load shops
  console.log("Loading shops...");
  const shopsData = fs.readFileSync(SHOPS_JSON, "utf-8");
  const shops: Shop[] = JSON.parse(shopsData);
  console.log(`Found ${shops.length} shops`);

  // Load progress
  const completed = await loadProgress();
  console.log(`Already completed: ${completed.size} shops`);

  // Filter remaining shops
  const remaining = shops.filter((shop) => !completed.has(shop.number));
  console.log(`Remaining: ${remaining.length} shops`);

  if (remaining.length === 0) {
    console.log("All shops have been added!");
    return;
  }

  // Launch browser
  console.log("Launching Chrome...");
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1280, height: 800 },
  });

  const page = context.pages()[0] || (await context.newPage());

  // Navigate to Google Maps
  console.log("Navigating to Google Maps...");
  await page.goto("https://www.google.com/maps");
  await delay(DELAY_BETWEEN_ACTIONS * 2);

  // Process each shop
  for (const shop of remaining) {
    console.log(`\n[${shop.number}/${shops.length}] ${shop.name}`);

    const success = await searchAndSaveShop(page, shop, LIST_NAME);

    if (success) {
      completed.add(shop.number);
      saveProgress(completed);
    }

    // Wait between shops
    await delay(DELAY_BETWEEN_SHOPS);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Completed: ${completed.size}/${shops.length} shops`);
  console.log("=".repeat(60));

  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
