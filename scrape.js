import puppeteer, { Target } from "puppeteer";
import fsPromises from "fs/promises";
async function scrapeLeetcodeProblems() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/114.0.5735.199 Safari/537.36"
  );
  await page.goto("https://leetcode.com/problemset/");
  const problemSelector =
    "a.group.flex.flex-col.rounded-\\[8px\\].duration-300";
  await page.waitForSelector('a[id="1"]');
  let allProblems = [];
  let prevCount = 0;
  const TARGET = 1200;
  while (allProblems.length < TARGET) {
    await page.evaluate((sel) => {
      const currProblemsOnPage = document.querySelectorAll(sel);
      if (currProblemsOnPage.length) {
        currProblemsOnPage[currProblemsOnPage.length - 1].scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, problemSelector);
    await page.waitForFunction(
      (sel, prev) => document.querySelectorAll(sel).length > prev,
      {},
      problemSelector,
      prevCount
    );
    allProblems = await page.evaluate((sel) => {
      const nodes = Array.from(document.querySelectorAll(sel));
      return nodes.map((el) => ({
        title: el
          .querySelector(".ellipsis.line-clamp-1")
          ?.textContent.trim()
          .split(". ")[1],
        url: el.href,
      }));
    }, problemSelector);
    prevCount = allProblems.length;
  }
  // Now, for each problem, visit its URL and extract the description
  const problemsWithDescriptions = [];
  for (let i = 0; i < TARGET; i++) {
    const { title, url } = allProblems[i];
    if (!url) continue;
    const problemPage = await browser.newPage();
    try {
      await problemPage.goto(url);
      let description = await problemPage.evaluate(() => {
        const descriptionDiv = document.querySelector(
          'div.elfjS[data-track-load="description_content"]'
        );
        if (!descriptionDiv) return "";
        const paragraphs = descriptionDiv.querySelectorAll("p");
        let collectedDescription = [];
        for (const p of paragraphs) {
          if (p.innerHTML.trim() === "&nbsp;") {
            break;
          }
          collectedDescription.push(p.innerText.trim());
        }
        return collectedDescription.filter((text) => text !== "").join(" ");
      });
      problemsWithDescriptions.push({ title, url, description });
    } catch (err) {
      console.error(`Error fetching description for ${title} (${url}):`, err);
    } finally {
      await problemPage.close();
    }
  }
  await fsPromises.mkdir("./problems", { recursive: true });
  await fsPromises.writeFile(
    "./problems/leetcode_problems.json",
    JSON.stringify(problemsWithDescriptions, null, 2)
  );
  await browser.close();
}
scrapeLeetcodeProblems();