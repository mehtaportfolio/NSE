import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

// ------------------------------------------------------
// 🔵 1) NSE Proxy — Gets sector + industry from NSE API
// ------------------------------------------------------
app.get("/nse", async (req, res) => {
  try {
    const symbol = req.query.symbol;
    if (!symbol) {
      return res.status(400).json({ error: "Missing symbol" });
    }

    const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;

    const result = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        referer: "https://www.nseindia.com/",
      },
    });

    const data = await result.json();

    const sector =
      data?.info?.industry || data?.industryInfo?.industry || "";

    const industry =
      data?.metadata?.industry || data?.industryInfo?.sector || "";

    return res.json({
      symbol,
      sector,
      industry,
    });
  } catch (err) {
    return res.status(500).json({
      error: "NSE Proxy Error",
      message: err.message,
    });
  }
});

// ------------------------------------------------------
// 🟣 2) Yahoo Finance — Sector, Industry, MarketCap
// ------------------------------------------------------
app.get("/yahoo", async (req, res) => {
  try {
    const ticker = req.query.ticker;
    if (!ticker) {
      return res.status(400).json({ error: "Missing ticker" });
    }

    // ----------------------------
    // 1️⃣ Fetch Profile (Sector/Industry)
    // ----------------------------
    const profileUrl =
      `https://query2.finance.yahoo.com/v1/finance/profile/${ticker}`;

    const profileRes = await fetch(profileUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const profileJson = await profileRes.json();
    const profile = profileJson?.assetProfile || {};

    const sector = profile?.sector || "";
    const industry = profile?.industry || "";

    // ----------------------------
    // 2️⃣ Fetch Market Cap
    // ----------------------------
    const chartUrl =
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;

    const chartRes = await fetch(chartUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const chartJson = await chartRes.json();
    const meta = chartJson?.chart?.result?.[0]?.meta;

    const marketCap = meta?.marketCap || 0;

    // ----------------------------
    return res.json({
      ticker,
      sector,
      industry,
      marketCap,
    });

  } catch (err) {
    return res.status(500).json({
      error: "Yahoo Proxy Error",
      message: err.message,
    });
  }
});

// ------------------------------------------------------
app.listen(3000, () => {
  console.log("API Server running on port 3000 🔥");
});
