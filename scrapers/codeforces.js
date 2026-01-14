import puppeteer from "puppeteer";

export async function scrapeCodeforces() {
  console.log("Starting Codeforces Scrape...");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36"
  );

  const problems = [];
  const PAGES_TO_SCRAPE = 5; // Reduced for testing. Increase as needed.

  for (let i = 1; i <= PAGES_TO_SCRAPE; i++) {
    const url = `https://codeforces.com/problemset/page/${i}`;
    console.log(`Navigating to page ${i}...`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const problemSelector = "table.problems tr td:nth-of-type(2) > div:first-of-type > a";
      
      const links = await page.evaluate((sel) => {
        const anchors = document.querySelectorAll(sel);
        return Array.from(anchors).map((a) => a.href);
      }, problemSelector);

      // Iterate through links on this page
      for (const link of links) {
        try {
          // Open a new tab for the problem to keep the main list open (optional strategy, or just reuse page)
          // Here we reuse the page to be simple, but navigating back/forth is slower. 
          // Better: open new page.
          const problemPage = await browser.newPage();
          await problemPage.goto(link, { waitUntil: "domcontentloaded" });

          const data = await problemPage.evaluate(() => {
            const titleEl = document.querySelector(".problem-statement .title");
            const descEl = document.querySelector(".problem-statement > div:nth-of-type(2)");
            
            if (!titleEl || !descEl) return null;

            return {
              title: titleEl.textContent,
              description: descEl.textContent.replace(/\s+/g, " ").trim()
            };
          });

          if (data) {
            problems.push({
              title: data.title,
              url: link,
              description: data.description,
            });
            console.log(`Scraped: ${data.title}`);
          }
          
          await problemPage.close();

        } catch (err) {
          console.warn(`❌ Failed to scrape ${link}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`Error on page ${i}: ${err.message}`);
    }
  }

  await browser.close();
  return problems;
}