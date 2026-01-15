import fs from "fs/promises";
import path from "path";
import { scrapeCSES } from "./cses.js";
import { scrapeAtCoder } from "./atcoder.js";
import { scrapeCodeChef } from "./codechef.js";
import { scrapeLeetcode } from "./leetcode.js";     // <-- Import this
import { scrapeCodeforces } from "./codeforces.js"; // <-- Import this

async function runAll() {
    const allData = [];
    
    // Run them sequentially or use Promise.all() for parallelism (careful with RAM/CPU)
    
    const leetcode = await scrapeLeetcode();
    const codeforces = await scrapeCodeforces();
    const cses = await scrapeCSES();
    const atcoder = await scrapeAtCoder();
    const codechef = await scrapeCodeChef();

    allData.push(...leetcode, ...codeforces, ...cses, ...atcoder, ...codechef);

    // For testing, maybe just run one:
    // const leetcode = await scrapeLeetcode(); 
    // allData.push(...leetcode);

    // Ensure directory exists
    const outputDir = path.resolve("../server/data");
    await fs.mkdir(outputDir, { recursive: true });
    
    await fs.writeFile(
        path.join(outputDir, "all_problems.json"), 
        JSON.stringify(allData, null, 2)
    );
    console.log(`Saved ${allData.length} problems to server/data/all_problems.json`);
}

runAll();