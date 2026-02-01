import * as fs from "node:fs";
import * as path from "node:path";
import { load } from "cheerio";
import { ShopsSchema, type Shop, type ShopLinks } from "../types/shop.js";

const INPUT_FILE = path.resolve(import.meta.dirname, "../../input/shop.html");
const OUTPUT_FILE = path.resolve(
  import.meta.dirname,
  "../../output/shops.json",
);

function parseShopLinks(linkHtml: cheerio.Cheerio<cheerio.Element>): ShopLinks {
  const links: ShopLinks = {
    website: null,
    instagram: null,
    x: null,
    facebook: null,
  };

  linkHtml.find("a").each((_, el) => {
    const href = linkHtml.find(el).attr("href");
    if (!href) return;

    const img = linkHtml.find(el).find("img");
    const alt = img.attr("alt") || "";
    const src = img.attr("src") || "";

    if (src.includes("icon_insta")) {
      links.instagram = href;
    } else if (src.includes("icon_x_black")) {
      links.x = href;
    } else if (src.includes("icon_facebook")) {
      links.facebook = href;
    } else if (src.includes("icon_hp") || alt.includes("WEBサイト")) {
      links.website = href;
    }
  });

  return links;
}

function parseHtml(html: string): Shop[] {
  const $ = load(html);
  const shops: Shop[] = [];

  $("ul.shoplist > li").each((_, li) => {
    const $li = $(li);

    // Shop number and name from h5
    const h5 = $li.find("h5");
    const numberText = h5.find(".shop_num_wrap").text().trim();
    const number = Number.parseInt(numberText, 10);
    // Remove the number span and get the remaining text as the name
    const name = h5.text().replace(numberText, "").trim();

    // Image URL
    const img = $li.find(".eyecatch img");
    const imageUrl = img.attr("src") || null;

    // Table data
    const tableRows = $li.find("table.tb_shop tbody tr");
    let businessHours = "";
    let regularHoliday = "";
    let address = "";
    let tel: string | null = null;
    let sentraSetHours: string | null = null;

    tableRows.each((_, row) => {
      const $row = $(row);
      const th = $row.find("th").text().trim();
      const td = $row.find("td");

      // Extract sentra set hours from nested div
      const sentraDiv = td.find(".shop_sentr_tz_wrap");
      if (sentraDiv.length > 0) {
        // Get text after the first <br /> in the <p>
        const sentraText = sentraDiv.find("p").html();
        if (sentraText) {
          // Match everything after the first <br />
          const match = sentraText.match(/<br\s*\/?>\s*([\s\S]*)/i);
          if (match) {
            sentraSetHours = match[1]
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<[^>]*>/g, "")
              .trim();
          }
        }
        // Remove the sentra div to get clean main content
        sentraDiv.remove();
      }

      // Get main td content (with HTML entities decoded)
      const tdContent = td.html();
      const cleanContent = tdContent
        ? tdContent
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .trim()
        : "";

      switch (th) {
        case "営業時間":
          businessHours = cleanContent;
          break;
        case "定休日":
          regularHoliday = cleanContent;
          break;
        case "住所":
          address = cleanContent;
          break;
        case "TEL":
          tel = cleanContent === "なし" ? null : cleanContent;
          break;
      }
    });

    // Description
    const descriptionHtml = $li.find(".shop_msg_wrap").html();
    const description = descriptionHtml
      ? descriptionHtml
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?p>/gi, "")
          .replace(/<[^>]*>/g, "")
          .replace(/&amp;/g, "&")
          .trim()
      : "";

    // Links
    const linksDiv = $li.find(".shop_link");
    const links = parseShopLinks(linksDiv);

    shops.push({
      number,
      name,
      imageUrl,
      businessHours,
      sentraSetHours,
      regularHoliday,
      address,
      tel,
      description,
      links,
    });
  });

  return shops;
}

function main() {
  console.log("Reading HTML file...");
  const html = fs.readFileSync(INPUT_FILE, "utf-8");

  console.log("Parsing shops...");
  const shops = parseHtml(html);

  console.log(`Found ${shops.length} shops`);

  // Validate with Zod
  console.log("Validating with Zod schema...");
  const validated = ShopsSchema.parse(shops);

  // Write output
  console.log(`Writing to ${OUTPUT_FILE}...`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validated, null, 2), "utf-8");

  console.log("Done!");
}

main();
