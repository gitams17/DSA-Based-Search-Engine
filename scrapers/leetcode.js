import puppeteer from "puppeteer";

export async function scrapeLeetcode() {
  console.log("Starting LeetCode Scrape...");
  const browser = await puppeteer.launch({
    headless: false, // LeetCode often blocks headless, so keep this false
    defaultViewport: null,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36"
  );

  await page.goto("https://leetcode.com/problemset/", {
    waitUntil: "domcontentloaded",
  });

  const problemSelector = "a.group.flex.flex-col.rounded-\\[8px\\].duration-300";
  
  let allProblems = [];
  let prevCount = 0;
  const TARGET = 50; // Reduced for testing. Set to 3000+ for full scrape.

  console.log(`Fetching list of ${TARGET} problems...`);

  while (allProblems.length < TARGET) {
    // Scroll to bottom to trigger infinite load
    await page.evaluate((sel) => {
      const currProblemsOnPage = document.querySelectorAll(sel);
      if (currProblemsOnPage.length) {
        currProblemsOnPage[currProblemsOnPage.length - 1].scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, problemSelector);

    // Wait for new items to load
    try {
      await page.waitForFunction(
        (sel, prev) => document.querySelectorAll(sel).length > prev,
        { timeout: 5000 },
        problemSelector,
        prevCount
      );
    } catch (e) {
      console.log("No new problems loaded or timeout reached.");
      break;
    }

    allProblems = await page.evaluate((sel) => {
      const nodes = Array.from(document.querySelectorAll(sel));
      return nodes.map((el) => ({
        title: el.textContent.split(". ")[1] || "Untitled", // Robustness check
        url: el.href,
      }));
    }, problemSelector);

    prevCount = allProblems.length;
    console.log(`Loaded ${prevCount} problems...`);
  }

  // Slice to target to avoid processing too many if over-fetched
  allProblems = allProblems.slice(0, TARGET);

  // Visit each URL to get the description
  const problemsWithDescriptions = [];
  console.log("Fetching problem descriptions...");

  for (let i = 0; i < allProblems.length; i++) {
    const { title, url } = allProblems[i];
    if (!url) continue;

    const problemPage = await browser.newPage();
    try {
      await problemPage.goto(url, { waitUntil: "domcontentloaded" });
      
      const description = await problemPage.evaluate(() => {
        const descriptionDiv = document.querySelector(
          'div.elfjS[data-track-load="description_content"]'
        );
        if (!descriptionDiv) return "";
        
        const paragraphs = descriptionDiv.querySelectorAll("p");
        let collectedDescription = [];
        for (const p of paragraphs) {
          if (p.innerHTML.trim() === "&nbsp;") break;
          collectedDescription.push(p.innerText.trim());
        }
        return collectedDescription.filter((text) => text !== "").join(" ");
      });

      if (description) {
        problemsWithDescriptions.push({ title, url, description });
        console.log(`[${i + 1}/${allProblems.length}] Scraped: ${title}`);
      }
    } catch (err) {
      console.error(`Error fetching ${title}:`, err.message);
    } finally {
      await problemPage.close();
    }
  }

  await browser.close();
  return problemsWithDescriptions;
}