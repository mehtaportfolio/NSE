import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

// 🔥 Your RapidAPI credentials
const RAPID_KEY = "08b95b4e73msh6936203a4b0edd5p11a827jsnc9feaff2a3ab";
const RAPID_HOST = "yahoo-finance15.p.rapidapi.com";

// ---------------------------------------------
// ⭐ NEW RAPIDAPI YAHOO ENDPOINT
// ---------------------------------------------
app.get("/yahoo-rapid", async (req, res) => {
  try {
    const ticker = req.query.ticker;
    if (!ticker)
      return res.status(400).json({ error: "Missing ticker" });

    const url = `https://${RAPID_HOST}/api/yahoo/qu/quote/${ticker}`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPID_KEY,
        "x-rapidapi-host": RAPID_HOST,
      },
    });

    const text = await response.text();
    console.log("RAW RAPIDAPI:", text); // 🔥 LOG to verify

    const data = JSON.parse(text);

    const quote = data?.quoteResponse?.result?.[0] || {};

    res.json({
      ticker,
      sector: quote.sector || "",
      industry: quote.industry || "",
      marketCap: quote.marketCap || 0,
    });
  } catch (err) {
    res.status(500).json({
      error: "RapidAPI Proxy Error",
      message: err.message,
    });
  }
});

app.listen(3000, () =>
  console.log("API Server running on port 3000 🔥")
);
