
import express from "express";
import fs from "fs/promises";
import pkg from "natural";
import { removeStopwords } from "stopword";
const { TfIdf } = pkg;

function preprocess(text) {
  return removeStopwords(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
  ).join(" ");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("."));

let problems = [];
let tfidf = new TfIdf();

async function loadProblemsAndBuildIndex() {
  const data = await fs.readFile("./corpus/all_problems.json", "utf-8");
  problems = JSON.parse(data);

  tfidf = new TfIdf();

  problems.forEach((problem, idx) => {
    const text = preprocess(
      `${problem.title} ${problem.title} ${problem.description || ""}`
    );

    tfidf.addDocument(text, idx.toString());
  });
}

app.post("/search", async (req, res) => {
  const query = preprocess(req.body.query);

  if (!query || typeof query !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'query' in request body" });
  }

  const scores = [];

  tfidf.tfidfs(query, (i, measure) => {
    scores.push({ idx: i, score: measure });
  });

  const top = scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => {
      const p = problems[s.idx];

      let platform = p.url.includes("leetcode.com") ? "LeetCode" : "Codeforces";

      return { ...p, platform };
    });

  res.json({ results: top });
});

loadProblemsAndBuildIndex().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
