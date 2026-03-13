import * as cheerio from "cheerio";
import type { Element } from "domhandler";

// Quick script to inspect WWOZ livewire HTML structure
// Run: npx tsx scraper/inspect-wwoz.ts

async function inspect() {
  const response = await fetch("https://www.wwoz.org/livewire", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    console.error(`Failed: ${response.status} ${response.statusText}`);
    // Check if it redirected
    console.log(`Final URL: ${response.url}`);
    return;
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  console.log(`Page title: ${$("title").text()}`);
  console.log(`HTML length: ${html.length} chars\n`);

  // Log all unique class names in the page
  const classes = new Set<string>();
  $("[class]").each((_, el) => {
    const cls = $(el).attr("class");
    if (cls) cls.split(/\s+/).forEach((c) => classes.add(c));
  });

  // Filter for likely event-related classes
  const eventKeywords = [
    "event", "listing", "livewire", "show", "gig", "venue",
    "artist", "band", "date", "time", "schedule", "calendar",
    "music", "performance", "view", "row", "item", "card",
    "field", "group", "header",
  ];

  const relevant = [...classes].filter((c) =>
    eventKeywords.some((k) => c.toLowerCase().includes(k))
  );

  console.log("--- Relevant CSS classes ---");
  relevant.sort().forEach((c) => console.log(`  .${c}`));

  console.log(`\n--- All unique classes (${classes.size} total) ---`);
  [...classes].sort().forEach((c) => console.log(`  .${c}`));

  // Log the main content structure
  console.log("\n--- Main content area structure ---");
  const main = $("main, #main, #content, .content, article, .main-content").first();
  if (main.length) {
    logStructure($, main, 0, 3);
  } else {
    console.log("No main/content element found. Logging body children:");
    logStructure($, $("body"), 0, 3);
  }

  // Dump the livewire calendar area
  console.log("\n--- .livewire-calendar structure ---");
  const cal = $(".livewire-calendar");
  if (cal.length) {
    logStructure($, cal, 0, 5);
  } else {
    console.log("No .livewire-calendar found");
  }

  // Dump the first .heading-date and following content
  console.log("\n--- First .heading-date ---");
  const firstDate = $(".heading-date").first();
  if (firstDate.length) {
    console.log(`Tag: ${firstDate.prop("tagName")}`);
    console.log(`HTML: ${$.html(firstDate)}`);
    console.log(`Text: ${firstDate.text().trim()}`);
  }

  // Dump the first few .livewire-listing items
  console.log("\n--- First 3 .livewire-listing items ---");
  $(".livewire-listing").slice(0, 3).each((i, el) => {
    console.log(`\n[${i}] Full HTML:`);
    console.log($.html(el));
  });

  // Dump the first few .list-group-item items
  console.log("\n--- First 3 .list-group-item items ---");
  $(".list-group-item").slice(0, 3).each((i, el) => {
    console.log(`\n[${i}] Full HTML:`);
    console.log($.html(el));
  });

  // Check panel structure
  console.log("\n--- .panel-heading items (first 3) ---");
  $(".panel-heading").slice(0, 3).each((i, el) => {
    console.log(`\n[${i}] HTML:`);
    console.log($.html(el));
  });
}

function logStructure(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<Element>,
  depth: number,
  maxDepth: number
) {
  if (depth > maxDepth) return;
  const indent = "  ".repeat(depth);

  el.children().each((_, child) => {
    if (child.type !== "tag") return;
    const $child = $(child);
    const tag = child.tagName;
    const id = $child.attr("id") ? `#${$child.attr("id")}` : "";
    const cls = $child.attr("class")
      ? `.${$child.attr("class")!.split(/\s+/).join(".")}`
      : "";
    const text = $child.contents().filter((_, n) => n.type === "text").text().trim().slice(0, 50);
    const textPreview = text ? ` "${text}"` : "";
    const childCount = $child.children().length;

    console.log(`${indent}<${tag}${id}${cls}> (${childCount} children)${textPreview}`);
    logStructure($, $child, depth + 1, maxDepth);
  });
}

inspect().catch(console.error);
