import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import natural from "natural";

const TfIdf = natural.TfIdf;

// Robust Path Resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up one level from 'services' to 'server', then into 'data'
const DATA_PATH = path.join(__dirname, "../data/all_problems.json");

let problems = [];
let tfidf = new TfIdf();
let docVectors = [];
let docMagnitudes = [];

const preprocess = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const initializeIndex = async () => {
  try {
    // Check if file exists first
    try {
      await fs.access(DATA_PATH);
    } catch {
      console.warn("⚠️ Data file not found at:", DATA_PATH);
      console.warn("Please run the scraper to generate data.");
      problems = [];
      return;
    }

    const data = await fs.readFile(DATA_PATH, "utf-8");
    problems = JSON.parse(data);
    console.log(`✅ Loaded ${problems.length} problems into memory.`);

    tfidf = new TfIdf();

    problems.forEach((p, idx) => {
      const content = `${p.title} ${p.title} ${p.description || ""}`;
      tfidf.addDocument(preprocess(content), idx.toString());
    });

    docVectors = [];
    docMagnitudes = [];

    problems.forEach((_, idx) => {
      const vector = {};
      let sumSquares = 0;
      tfidf.listTerms(idx).forEach(({ term, tfidf: weight }) => {
        vector[term] = weight;
        sumSquares += weight * weight;
      });
      docVectors[idx] = vector;
      docMagnitudes[idx] = Math.sqrt(sumSquares);
    });

    console.log("✅ Search index built successfully.");
  } catch (err) {
    console.error("❌ Error building index:", err.message);
    problems = [];
  }
};

export const searchProblems = (queryStr) => {
  if (!queryStr || problems.length === 0) return [];

  const query = preprocess(queryStr);
  const tokens = query.split(" ").filter(Boolean);
  
  if (tokens.length === 0) return [];

  const termFreq = {};
  tokens.forEach((t) => (termFreq[t] = (termFreq[t] || 0) + 1));

  const queryVector = {};
  let sumSqQ = 0;
  Object.entries(termFreq).forEach(([term, count]) => {
    const tf = count / tokens.length;
    const idf = tfidf.idf(term);
    const w = tf * idf;
    queryVector[term] = w;
    sumSqQ += w * w;
  });
  const queryMag = Math.sqrt(sumSqQ) || 1;

  const scores = problems.map((_, idx) => {
    const docVec = docVectors[idx];
    const docMag = docMagnitudes[idx] || 1;
    let dot = 0;
    for (const [term, wq] of Object.entries(queryVector)) {
      if (docVec[term]) dot += wq * docVec[term];
    }
    return { idx, score: dot / (queryMag * docMag) };
  });

  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ idx }) => problems[idx]);
};