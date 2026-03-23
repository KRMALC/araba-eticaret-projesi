/**
 * AI Canlı Destek — OpenAI proxy (API anahtarı yalnızca sunucuda)
 * Çalıştırma: npm install && npm run chat
 * Varsayılan port: 5001 (Flask 5000 ile birlikte)
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const PORT = Number(process.env.PORT) || 5001;
const MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

const SYSTEM_PROMPT =
  "Sen 'Oto Market' sitesinin uzman satış asistanısın. Sadece araba parçaları ve aksesuarları hakkında bilgi ver. Nazik ve yardımcı ol. " +
  "Parça uyumluluğu, bakım önerileri ve ürün seçimi konularında yardımcı ol. " +
  "Site dışı, siyaset, kişisel hukuk vb. konularda kısa ve nazikçe yalnızca yedek parça ve aksesuar konusuna yönlendir.";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "[server.js] UYARI: OPENAI_API_KEY tanımlı değil. .env dosyası oluşturun (.env.example'a bakın)."
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const app = express();
app.use(express.json({ limit: "80kb" }));

const allowedOrigins = (
  process.env.CHAT_CORS_ORIGINS ||
  "http://127.0.0.1:5000,http://localhost:5000,http://127.0.0.1:5500,http://localhost:5500"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0 &&
        m.content.length < 12000
    )
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.trim() }));
}

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        ok: false,
        error:
          "Sunucuda OPENAI_API_KEY ayarlı değil. Proje kökünde .env dosyası oluşturun.",
      });
    }

    const incoming = sanitizeMessages(req.body && req.body.messages);
    if (incoming.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Geçerli mesaj gönderin.",
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...incoming,
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const text =
      completion.choices &&
      completion.choices[0] &&
      completion.choices[0].message &&
      completion.choices[0].message.content
        ? completion.choices[0].message.content.trim()
        : "";

    if (!text) {
      return res.status(502).json({
        ok: false,
        error: "Yanıt alınamadı. Tekrar deneyin.",
      });
    }

    return res.json({ ok: true, reply: text });
  } catch (err) {
    console.error("[api/chat]", err.message || err);
    const msg =
      err.status === 401 || err.code === "invalid_api_key"
        ? "API anahtarı geçersiz veya eksik."
        : "Bir hata oluştu. Lütfen sonra tekrar deneyin.";
    return res.status(500).json({ ok: false, error: msg });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "oto-market-chat",
    hasKey: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`AI destek sunucusu: http://127.0.0.1:${PORT}`);
  console.log(`  POST /api/chat  — OpenAI model: ${MODEL}`);
});
