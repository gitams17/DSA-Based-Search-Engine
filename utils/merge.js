import fs from "fs/promises";
import path from "path";

async function mergeProblemData() {
  const codeforcesPath = path.resolve("./problems/codeforces_problems.json");
  const leetcodePath = path.resolve("./problems/leetcode_problems.json");

  const codeforcesData = JSON.parse(await fs.readFile(codeforcesPath, "utf-8"));
  const leetcodeData = JSON.parse(await fs.readFile(leetcodePath, "utf-8"));

  const combined = [...codeforcesData, ...leetcodeData];

  const outputDir = path.resolve("./corpus");
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "all_problems.json");
  await fs.writeFile(outputPath, JSON.stringify(combined, null, 2));
}

mergeProblemData();