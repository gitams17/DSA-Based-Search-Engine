import puppeteer from "puppeteer";

export async function scrapeAtCoder() {
  console.log("⚫ [AtCoder] Starting scrape...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const problems = [];

  // Scrape a range of Beginner Contests (e.g., ABC320 to ABC325)
  const contests = ["abc320", "abc321", "abc322", "abc323", "abc324"];

  for (const contest of contests) {
    const url = `https://atcoder.jp/contests/${contest}/tasks`;
    console.log(`   Visiting ${contest}...`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const links = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("table tbody tr"));
        return rows
          .map((tr) => {
            const anchor = tr.querySelector("td:nth-child(2) a");
            return anchor
              ? { title: anchor.innerText, url: anchor.href }
              : null;
          })
          .filter(Boolean);
      });

      for (const link of links) {
        const pPage = await browser.newPage();
        try {
          await pPage.goto(link.url, { waitUntil: "domcontentloaded" });
          const description = await pPage.evaluate(() => {
            const langEn = document.querySelector("span.lang-en");
            if (langEn) return langEn.innerText;
            const section = document.querySelector("#task-statement");
            return section ? section.innerText : "";
          });

          if (description) {
            problems.push({
              title: link.title,
              url: link.url,
              description: description.replace(/\n/g, " ").trim(),
              platform: "AtCoder",
            });
            console.log(`   AtCoder: ${link.title}`);
          }
        } catch (e) {
        } finally {
          await pPage.close();
        }
      }
    } catch (e) {
      console.error(`   Failed to access ${contest}`);
    }
  }

  await browser.close();
  return problems;
}
