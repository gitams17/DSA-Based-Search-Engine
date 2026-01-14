import express from "express";
import cors from "cors";
import { initializeIndex, searchProblems } from "./services/searchEngine.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow frontend to communicate
app.use(express.json());

// Initialize Search Engine on Start
initializeIndex();

app.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query parameter 'q' required" });

  try {
    const results = searchProblems(q);
    res.json({ count: results.length, results });
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});