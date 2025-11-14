import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/nse", async (req, res) => {
  try {
    const symbol = req.query.symbol;
    if (!symbol) return res.status(400).json({ error: "Missing symbol" });

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

    res.json({
      symbol,
      sector,
      industry,
    });
  } catch (err) {
    res.status(500).json({
      error: "Proxy error",
      message: err.message,
    });
  }
});

app.listen(3000, () => console.log("Proxy running on port 3000"));
