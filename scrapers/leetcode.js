import puppeteer from "puppeteer";

export async function scrapeLeetcode() {
  console.log("🟡 [LeetCode] Starting scrape...");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  const problems = [];
  const LIMIT = 500; // Adjust as needed

  try {
    await page.goto("https://leetcode.com/problemset/", {
      waitUntil: "networkidle2",
    });

    // More robust selector than specific Tailwind classes
    const problemSelector = 'a[href^="/problems/"]';
    const links = new Set();

    console.log("   [LeetCode] collecting links...");

    while (links.size < LIMIT) {
      // Collect visible links
      const newLinks = await page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel))
          .map((a) => a.href)
          .filter(
            (h) => !h.includes("/solution") && !h.includes("/submissions")
          );
      }, problemSelector);

      newLinks.forEach((l) => links.add(l));

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait a bit for lazy load
      await new Promise((r) => setTimeout(r, 1500));

      // Break if we are stuck or have enough
      if (newLinks.length === 0 && links.size > 0) break;
    }

    const targetLinks = Array.from(links).slice(0, LIMIT);

    for (let i = 0; i < targetLinks.length; i++) {
      const url = targetLinks[i];
      const pPage = await browser.newPage();
      try {
        await pPage.goto(url, { waitUntil: "domcontentloaded" });

        const data = await pPage.evaluate(() => {
          const title = document.title.split("-")[0].trim();
          const descEl =
            document.querySelector('[data-track-load="description_content"]') ||
            document.querySelector(".elfjS");
          return {
            title,
            description: descEl ? descEl.innerText.replace(/\n/g, " ") : "",
          };
        });

        if (data.description) {
          problems.push({ ...data, url, platform: "LeetCode" });
          console.log(
            `   [${i + 1}/${targetLinks.length}] LeetCode: ${data.title}`
          );
        }
      } catch (e) {
        console.warn(`   Failed: ${url}`);
      } finally {
        await pPage.close();
      }
    }
    return problems;
  } catch (error) {
    console.error("LeetCode Error:", error);
    return [];
  } finally {
    await browser.close();
  }
}
