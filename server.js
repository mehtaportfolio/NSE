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

app.get("/yahoo", async (req, res) => {
  try {
    const ticker = req.query.ticker;
    if (!ticker)
      return res.status(400).json({ error: "Missing ticker" });

    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=summaryProfile,price`;

    const result = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    // ✅ ADD DEBUG LINE HERE
    const raw = await result.text();
    console.log("RAW RESPONSE:", raw);

    // Then parse JSON
    const json = JSON.parse(raw);

    const data = json?.quoteSummary?.result?.[0];

    const sector = data?.summaryProfile?.sector || "";
    const industry = data?.summaryProfile?.industry || "";
    const marketCap = data?.price?.marketCap?.raw || 0;

    res.json({
      ticker,
      sector,
      industry,
      marketCap,
    });

  } catch (err) {
    res.status(500).json({
      error: "Yahoo Proxy Error",
      message: err.message,
    });
  }
});



// ------------------------------------------------------
app.listen(3000, () => {
  console.log("API Server running on port 3000 🔥");
});
