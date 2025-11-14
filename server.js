import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/yahoo", async (req, res) => {
  try {
    const ticker = req.query.ticker;
    if (!ticker) return res.status(400).json({ error: "Missing ticker" });

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;

    const result = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        accept: "application/json",
      },
    });

    const raw = await result.text();
    console.log("RAW RESPONSE:", raw);

    const data = JSON.parse(raw);

    const quote = data?.quoteResponse?.result?.[0] || {};

    res.json({
      ticker,
      sector: quote?.sector || "",
      industry: quote?.industry || "",
      marketCap: quote?.marketCap || 0,
    });

  } catch (err) {
    res.status(500).json({
      error: "Yahoo Proxy Error",
      message: err.message,
    });
  }
});

app.listen(3000, () => console.log("API Server running on port 3000 🔥"));
