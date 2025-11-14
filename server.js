// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

// --- CONFIG (set RAPIDAPI_KEY in env) ---
const RAPIDAPI_HOST = "yahoo-finance15.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ""; // set this on Render

if (!RAPIDAPI_KEY) {
  console.warn("⚠️ RAPIDAPI_KEY not set. Please set env var RAPIDAPI_KEY.");
}

// Simple in-memory cache: ticker -> { data, expiresAt }
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const cache = new Map();

// Helper: call RapidAPI quote endpoint
async function callRapid(ticker) {
  const url = `https://${RAPIDAPI_HOST}/api/v1/markets/quote?symbols=${encodeURIComponent(ticker)}`;
  const resp = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
      "accept": "application/json"
    },
    timeout: 10000
  });
  const json = await resp.json();
  return json;
}

// Fetch with retry & cache
async function fetchRapidWithCache(ticker, retries = 2) {
  const key = ticker.toUpperCase();
  // cache hit
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let attempt = 0;
  let lastErr = null;
  while (attempt <= retries) {
    try {
      const raw = await callRapid(key);
      // RapidAPI response shape differs between providers; try common paths:
      const result =
        raw?.quoteResponse?.result?.[0] ||
        raw?.data?.[0] ||
        raw?.quote?.[0] ||
        null;

      // Normalize returned fields
      let sector = "";
      let industry = "";
      let marketCap = 0;

      if (result) {
        sector = result?.sector || result?.industrySector || "";
        industry = result?.industry || result?.industryName || result?.industry_sector || "";
        marketCap = result?.marketCap || result?.market_cap || result?.marketCapRaw || result?.market_cap_raw || 0;
      } else {
        // provider sometimes nests under `result` key
        if (raw?.quoteResponse?.result && raw.quoteResponse.result.length === 0) {
          // nothing found
        }
      }

      const out = { ticker: key, sector: sector || "", industry: industry || "", marketCap: Number(marketCap) || 0 };

      // store in cache
      cache.set(key, { data: out, expiresAt: Date.now() + CACHE_TTL_MS });

      return out;
    } catch (err) {
      lastErr = err;
      attempt++;
      const backoff = 300 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  // All retries failed
  throw lastErr || new Error("Unknown RapidAPI error");
}

// --- Endpoint: yahoo-rapid
app.get("/yahoo-rapid", async (req, res) => {
  try {
    const ticker = req.query.ticker;
    if (!ticker) return res.status(400).json({ error: "Missing ticker" });

    try {
      const data = await fetchRapidWithCache(ticker, 2);
      return res.json(data);
    } catch (err) {
      console.error("RapidAPI fetch failed for", ticker, err && err.message);
      return res.status(502).json({ error: "RapidAPI fetch failed", message: String(err && err.message) });
    }
  } catch (err) {
    return res.status(500).json({ error: "Server error", message: String(err && err.message) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Server running on port ${PORT} 🔥`));
