// server.js
import express from "express";
import fetch from "node-fetch"; // node-fetch v3+ uses ESM by default
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Your existing code below remains the same


// Helper to fetch NSE unofficial API
async function fetchNSEData(symbol) {
  const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com/",
    "Accept": "application/json, text/javascript, */*; q=0.01"
  };

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.log(`⚠️ NSE HTTP ${res.status} for ${symbol}`);
      return null;
    }

    const data = await res.json();
    const sector = data.industryInfo?.sector || "";
    const industry = data.industryInfo?.industry || "";

    if (!sector && !industry) return null;
    return { symbol, sector, industry };
  } catch (err) {
    console.log(`❌ NSE fetch error for ${symbol}:`, err.message);
    return null;
  }
}

// POST endpoint to fetch multiple NSE tickers
app.post("/fetch-nse", async (req, res) => {
  const { tickers } = req.body;
  if (!tickers || !Array.isArray(tickers)) {
    return res.status(400).json({ error: "Please provide an array of tickers." });
  }

  const results = [];
  for (let ticker of tickers) {
    const symbol = ticker.replace(/\.NS$/i, "").trim(); // Remove Yahoo suffix if any
    const data = await fetchNSEData(symbol);
    if (data) results.push(data);
    await new Promise(r => setTimeout(r, 500)); // small delay to prevent NSE blocking
  }

  res.json({ results });
});

// Health check
app.get("/", (req, res) => {
  res.send("NSE Sector/Industry Fetcher running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
