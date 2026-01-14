import puppeteer from "puppeteer";

export async function scrapeAtCoder() {
  console.log("Starting AtCoder Scrape...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // AtCoder organizes by contests. We'll scrape a recent contest for example.
  // Ideally, iterate through https://atcoder.jp/contests/archive
  const contestUrl = "https://atcoder.jp/contests/abc330/tasks"; 
  
  await page.goto(contestUrl, { waitUntil: "networkidle2" });

  const links = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    return rows.map(tr => {
        const anchor = tr.querySelector("td:nth-child(2) a");
        return anchor ? { title: anchor.innerText, url: anchor.href } : null;
    }).filter(Boolean);
  });

  const problems = [];
  for (const link of links) {
    try {
        await page.goto(link.url, { waitUntil: "domcontentloaded" });
        // AtCoder has English and Japanese. We try to find the English section.
        const description = await page.evaluate(() => {
             // Usually English is first or inside span.lang-en
             const langEn = document.querySelector("span.lang-en");
             if(langEn) return langEn.innerText;
             
             // Fallback
             const section = document.querySelector("#task-statement");
             return section ? section.innerText : "";
        });

        problems.push({ ...link, description: description.replace(/\s+/g, ' ').trim() });
        console.log(`Scraped: ${link.title}`);
    } catch(e) {
        console.error(`Error scraping ${link.url}`);
    }
  }
  
  await browser.close();
  return problems;
}