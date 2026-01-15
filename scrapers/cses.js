import puppeteer from "puppeteer";

export async function scrapeCSES() {
  console.log("Starting CSES Scrape...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // CSES Problem Set List
  await page.goto("https://cses.fi/problemset/", { waitUntil: "domcontentloaded" });
  
  // Extract all problem links
  const tasks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".task a")).map(a => ({
      title: a.innerText,
      url: a.href
    }));
  });

  const problems = [];
  // Limit to first 20 for demo purposes, remove slice for full scrape
  for (const task of tasks) {
    try {
        await page.goto(task.url, { waitUntil: "domcontentloaded" });
        const description = await page.evaluate(() => {
            const content = document.querySelector(".content");
            return content ? content.innerText.replace(/\n/g, " ") : "";
        });
        
        problems.push({ ...task, description });
        console.log(`Scraped: ${task.title}`);
        // Be polite
        await new Promise(r => setTimeout(r, 500));
    } catch(e) {
        console.error(`Failed ${task.url}`);
    }
  }

  await browser.close();
  return problems;
}