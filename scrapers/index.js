import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { scrapeCSES } from "./cses.js";
import { scrapeAtCoder } from "./atcoder.js";
import { scrapeCodeChef } from "./codechef.js";
import { scrapeLeetcode } from "./leetcode.js";
import { scrapeCodeforces } from "./codeforces.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAll() {
    const allData = [];
    
    console.log("🚀 Starting Global Scrape...");

    try {
        // const leetcode = await scrapeLeetcode();
        // allData.push(...leetcode);

        // const codeforces = await scrapeCodeforces();
        // allData.push(...codeforces);

        // const cses = await scrapeCSES();
        // allData.push(...cses);

        // const atcoder = await scrapeAtCoder();
        // allData.push(...atcoder);

        const codechef = await scrapeCodeChef();
        allData.push(...codechef);

        // Path to server/data/all_problems.json
        const outputDir = path.resolve(__dirname, "../server/data");
        await fs.mkdir(outputDir, { recursive: true });
        
        await fs.writeFile(
            path.join(outputDir, "all_problems.json"), 
            JSON.stringify(allData, null, 2)
        );
        console.log(`✅ Saved ${allData.length} problems to server/data/all_problems.json`);
    } catch (e) {
        console.error("🔥 Error in orchestrator:", e);
    }
}

runAll();