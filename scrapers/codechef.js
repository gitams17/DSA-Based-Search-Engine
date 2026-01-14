import puppeteer from "puppeteer";

export async function scrapeCodeChef() {
  console.log("Starting CodeChef Scrape...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // CodeChef Practice Page (Beginner)
  await page.goto("https://www.codechef.com/practice/difficulty/0", { waitUntil: "networkidle2" });
  
  // Wait for the table to load (dynamic React app)
  await page.waitForSelector("table");

  const problemLinks = await page.evaluate(() => {
    // Select first 10 rows
    const rows = Array.from(document.querySelectorAll("tbody tr")).slice(0, 10);
    return rows.map(tr => {
        const a = tr.querySelector("a"); // Link is usually in the first/second cell
        return a ? { title: a.innerText, url: a.href } : null;
    }).filter(Boolean);
  });

  const problems = [];
  for (const link of problemLinks) {
    try {
        await page.goto(link.url, { waitUntil: "domcontentloaded" });
        const description = await page.evaluate(() => {
            const el = document.querySelector("#problem-statement") || document.querySelector(".problem-statement");
            return el ? el.innerText : "";
        });
        
        problems.push({ ...link, description: description.replace(/\s+/g, ' ').trim() });
        console.log(`Scraped: ${link.title}`);
    } catch (e) { console.error(e); }
  }

  await browser.close();
  return problems;
}