import { useState, useEffect, useCallback } from "react";

const ACCENT = { green: "#00d4aa", blue: "#5b9fff", amber: "#ffb224", red: "#ff6b6b", purple: "#a78bfa" };
const BG = { primary: "#0a0b0d", secondary: "#111216", tertiary: "#191a1f", card: "#14151a" };
const BORDER = "#1e2028";
const TEXT = { primary: "#e8e9ed", secondary: "#8b8d98", muted: "#5c5e6a" };

const FRAMEWORKS = [
  "McKinsey 7S + Porter's Five Forces",
  "BCG Growth-Share Matrix",
  "Blue Ocean Strategy Canvas",
  "PESTEL + SWOT",
  "TAM/SAM/SOM + Competitive Analysis",
];

const MARKETS = [
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇰🇪", name: "Kenya" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇪🇬", name: "Egypt" },
  { flag: "🇦🇪", name: "UAE" },
  { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇮🇳", name: "India" },
];

const QUICK_TAGS = ["🧴 Skincare", "🍜 QSR / Fast Food", "⚡ Energy", "🏗️ Construction", "💰 FinTech", "🚗 Auto Parts", "👗 Fashion", "💊 Pharma"];

const buildSystemPrompt = (query, market, framework, investment, region) => `You are a senior strategy consultant at McKinsey & Company producing a market intelligence report. You must search the web extensively to find REAL data for this report. Do NOT make up numbers — search for actual statistics, companies, and market data.

RESEARCH TASK:
- Industry/Product: ${query}
- Target Market: ${market}
- Analysis Framework: ${framework}
- Investment Range: ${investment}
- Focus Region: ${region}

INSTRUCTIONS:
1. Search the web thoroughly for real market data, real companies, real statistics
2. Find actual import/export data, real competitor names, real regulatory requirements
3. Use real macro-economic data for the target market
4. Cite actual sources where possible

Respond ONLY with a valid JSON object (no markdown, no backticks, no preamble). The JSON must have this exact structure:

{
  "title": "Report title",
  "executive_summary": {
    "headline": "One-line market thesis",
    "body": "3-4 sentence executive summary with real data points"
  },
  "market_sizing": {
    "tam": { "value": "$X.XB", "label": "Total Addressable Market", "description": "What this includes" },
    "sam": { "value": "$XXXM", "label": "Serviceable Addressable Market", "description": "Filtered segment" },
    "som": { "value": "$XXM", "label": "Serviceable Obtainable Market", "description": "Realistic capture" },
    "methodology": "How these numbers were derived, citing real sources"
  },
  "competitors": [
    { "name": "Real Company Name", "share": 28, "description": "Brief description", "color": "green" },
    { "name": "Real Company Name", "share": 22, "description": "Brief description", "color": "blue" },
    { "name": "Real Company Name", "share": 18, "description": "Brief description", "color": "amber" },
    { "name": "Real Company Name", "share": 15, "description": "Brief description", "color": "purple" },
    { "name": "Others / Local", "share": 17, "description": "Fragmented local market", "color": "muted" }
  ],
  "porters_five": {
    "rivalry": { "score": 8.2, "level": "high", "explanation": "Why" },
    "buyer_power": { "score": 6.5, "level": "med", "explanation": "Why" },
    "supplier_power": { "score": 4.1, "level": "low", "explanation": "Why" },
    "new_entrants": { "score": 7.0, "level": "med", "explanation": "Why" },
    "substitutes": { "score": 8.8, "level": "high", "explanation": "Why" }
  },
  "swot": {
    "strengths": ["point 1", "point 2", "point 3"],
    "weaknesses": ["point 1", "point 2", "point 3"],
    "opportunities": ["point 1", "point 2", "point 3"],
    "threats": ["point 1", "point 2", "point 3"]
  },
  "macro_data": {
    "currency_rate": { "label": "USD/Local Rate", "value": "real value", "status": "red" },
    "inflation": { "label": "Inflation (YoY)", "value": "real value", "status": "amber" },
    "gdp_growth": { "label": "GDP Growth", "value": "real value", "status": "green" },
    "consumer_confidence": { "label": "Consumer Confidence", "value": "real value", "status": "amber" }
  },
  "regulatory": {
    "registration_time": "6-12 months",
    "import_duty": "20%",
    "vat_rate": "7.5%",
    "key_agency": "NAFDAC",
    "notes": "Key regulatory considerations"
  },
  "recommendation": {
    "verdict": "Proceed / Proceed with Caution / Do Not Proceed",
    "headline": "One-line recommendation",
    "body": "Detailed phased recommendation with specific investment allocations",
    "payback_period": "24-36 months",
    "expected_margin": "35-45%"
  },
  "sources": [
    { "name": "Source Name", "type": "icon", "description": "What data was used", "date": "2025" }
  ]
}

IMPORTANT: Return ONLY the JSON. No other text.`;

async function generateReport(query, market, framework, investment, region) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildSystemPrompt(query, market, framework, investment, region),
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Research and compile a comprehensive market intelligence report for: "${query}" in ${market}. Search the web extensively for real, current data. Focus on ${region}. Investment range: ${investment}. Use the ${framework} framework. Perform at least 5 different web searches to gather comprehensive data.`
      }],
    }),
  });

  const data = await response.json();

  const searches = (data.content || [])
    .filter(b => b.type === "server_tool_use" && b.name === "web_search")
    .map(b => b.input?.query || "Searching...");

  const textBlocks = (data.content || []).filter(b => b.type === "text");
  const fullText = textBlocks.map(b => b.text).join("");

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse report data. Please try again.");

  const cleaned = jsonMatch[0].replace(/```json|```/g, "").trim();
  return { report: JSON.parse(cleaned), searches };
}

function Header() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 28px", borderBottom: `1px solid ${BORDER}`, background: BG.secondary,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 34, height: 34, background: ACCENT.green, borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Instrument Serif', serif", fontSize: 22, color: BG.primary, fontWeight: 600,
        }}>Ọ</div>
        <div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, letterSpacing: -0.5, color: TEXT.primary }}>
            Ọjà Intelligence
          </span>
          <span style={{ color: TEXT.muted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginLeft: 10, fontStyle: "italic" }}>
            emerging market research
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          background: "rgba(0,212,170,0.12)", color: ACCENT.green,
          padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace",
        }}>12 CREDITS</div>
      </div>
    </div>
  );
}

function Sidebar({ market, setMarket }) {
  return (
    <div style={{
      borderRight: `1px solid ${BORDER}`, padding: "20px 14px", background: BG.secondary,
      width: 240, flexShrink: 0, overflowY: "auto",
    }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT.muted, marginBottom: 12, fontWeight: 600 }}>
        Target Market
      </div>
      {MARKETS.map(m => (
        <div key={m.name} onClick={() => setMarket(m.name)} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
          cursor: "pointer", fontSize: 13, transition: "all 0.15s",
          background: market === m.name ? "rgba(0,212,170,0.12)" : "transparent",
          color: market === m.name ? ACCENT.green : TEXT.secondary,
        }}>
          <span style={{ fontSize: 16 }}>{m.flag}</span> {m.name}
        </div>
      ))}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT.muted, marginBottom: 12, fontWeight: 600 }}>
          Report Pricing
        </div>
        {[
          { l: "Standard Report", p: "$10", c: ACCENT.green },
          { l: "Premium + Analyst", p: "$75", c: ACCENT.amber },
          { l: "Enterprise Deep Dive", p: "$250", c: ACCENT.purple },
        ].map(r => (
          <div key={r.l} style={{
            display: "flex", justifyContent: "space-between", padding: "8px 4px",
            borderBottom: `1px solid ${BORDER}`, fontSize: 12, color: TEXT.secondary,
          }}>
            <span>{r.l}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", color: r.c }}>{r.p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataPanel({ report }) {
  const macro = report?.macro_data;
  const reg = report?.regulatory;
  const sources = report?.sources || [];
  const sc = { green: ACCENT.green, amber: ACCENT.amber, red: ACCENT.red };

  return (
    <div style={{
      borderLeft: `1px solid ${BORDER}`, padding: "20px 14px", background: BG.secondary,
      width: 290, flexShrink: 0, overflowY: "auto",
    }}>
      {macro && (
        <>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT.muted, marginBottom: 10, fontWeight: 600 }}>
            Live Data Feeds
          </div>
          <div style={{ background: BG.card, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: TEXT.muted, fontWeight: 600 }}>Macro</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(0,212,170,0.12)", color: ACCENT.green, fontFamily: "'DM Mono', monospace" }}>LIVE</span>
            </div>
            {Object.values(macro).map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>
                <span style={{ fontSize: 12, color: TEXT.secondary }}>{m.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: sc[m.status] || TEXT.primary }}>{m.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {reg && (
        <div style={{ background: BG.card, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: TEXT.muted, fontWeight: 600, marginBottom: 10 }}>Regulatory</div>
          {[
            { l: `${reg.key_agency} Reg. Time`, v: reg.registration_time },
            { l: "Import Duty", v: reg.import_duty },
            { l: "VAT Rate", v: reg.vat_rate },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 2 ? `1px solid ${BORDER}` : "none" }}>
              <span style={{ fontSize: 12, color: TEXT.secondary }}>{r.l}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.v}</span>
            </div>
          ))}
          {reg.notes && <p style={{ fontSize: 11, color: TEXT.muted, marginTop: 8, lineHeight: 1.5 }}>{reg.notes}</p>}
        </div>
      )}
      {sources.length > 0 && (
        <>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT.muted, marginBottom: 8, marginTop: 8, fontWeight: 600 }}>
            Sources
          </div>
          {sources.map((s, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 11, color: TEXT.secondary, lineHeight: 1.4 }}>
              <strong style={{ color: TEXT.primary, fontWeight: 500 }}>{s.name}</strong> — {s.description}
              <div style={{ fontSize: 10, color: TEXT.muted, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{s.date}</div>
            </div>
          ))}
        </>
      )}
      {!report && (
        <div style={{ textAlign: "center", padding: "40px 12px", color: TEXT.muted, fontSize: 13, lineHeight: 1.6 }}>
          Generate a report to see live market data, regulatory info, and sources here.
        </div>
      )}
    </div>
  );
}

function LoadingState({ searches }) {
  const steps = [
    "Initializing research pipeline...",
    "Searching global trade databases...",
    "Analyzing competitor landscape...",
    "Processing macroeconomic indicators...",
    "Compiling regulatory framework...",
    "Generating strategic analysis...",
    "Formatting final report...",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ background: BG.card, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40, textAlign: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", border: `3px solid ${BORDER}`,
        borderTopColor: ACCENT.green, margin: "0 auto 20px", animation: "spin 1s linear infinite",
      }} />
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, marginBottom: 8, color: TEXT.primary }}>
        Researching Market Data
      </div>
      <div style={{ fontSize: 13, color: TEXT.secondary, marginBottom: 20 }}>{steps[step]}</div>
      {searches.length > 0 && (
        <div style={{ textAlign: "left", maxWidth: 420, margin: "0 auto" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT.muted, marginBottom: 8, fontWeight: 600 }}>
            Web Searches Performed
          </div>
          {searches.map((s, i) => (
            <div key={i} style={{
              padding: "5px 12px", background: BG.tertiary, borderRadius: 6, marginBottom: 3,
              fontSize: 11, color: ACCENT.green, fontFamily: "'DM Mono', monospace",
            }}>🔍 {s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportView({ report }) {
  if (!report) return null;
  const fc = { high: ACCENT.red, med: ACCENT.amber, low: ACCENT.green };
  const cc = { green: ACCENT.green, blue: ACCENT.blue, amber: ACCENT.amber, purple: ACCENT.purple, muted: TEXT.muted };
  const sw = {
    strengths: { bg: "rgba(0,212,170,0.05)", c: ACCENT.green },
    weaknesses: { bg: "rgba(255,107,107,0.05)", c: ACCENT.red },
    opportunities: { bg: "rgba(91,159,255,0.05)", c: ACCENT.blue },
    threats: { bg: "rgba(255,178,36,0.05)", c: ACCENT.amber },
  };

  const Section = ({ num, label, children }) => (
    <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: ACCENT.green, marginBottom: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
        {num} — {label}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ background: BG.card, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: TEXT.primary }}>{report.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: ACCENT.green }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT.green, animation: "pulse 2s infinite" }} />
          Complete
        </div>
      </div>
      <div style={{ padding: 24 }}>

        <Section num="01" label="Executive Summary">
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, marginBottom: 10, fontWeight: 400 }}>{report.executive_summary.headline}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: TEXT.secondary }}>{report.executive_summary.body}</p>
        </Section>

        <Section num="02" label="Market Sizing (TAM / SAM / SOM)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "14px 0" }}>
            {["tam", "sam", "som"].map((k, i) => {
              const colors = [ACCENT.green, ACCENT.blue, ACCENT.amber];
              const d = report.market_sizing[k];
              return (
                <div key={k} style={{ background: BG.tertiary, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: TEXT.muted, marginBottom: 6 }}>{d.label}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: colors[i], marginBottom: 4 }}>{d.value}</div>
                  <div style={{ fontSize: 10, color: TEXT.muted }}>{d.description}</div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.6, color: TEXT.muted, fontStyle: "italic" }}>{report.market_sizing.methodology}</p>
        </Section>

        <Section num="03" label="Competitive Landscape">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "14px 0" }}>
            {report.competitors.map((c, i) => (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 100, fontSize: 12, color: TEXT.secondary, textAlign: "right", flexShrink: 0 }}>{c.name}</div>
                  <div style={{ flex: 1, height: 24, background: BG.tertiary, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${c.share}%`, borderRadius: 6,
                      background: cc[c.color] || TEXT.muted,
                      display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
                      fontSize: 10, fontFamily: "'DM Mono', monospace", color: BG.primary, fontWeight: 600,
                    }}>{c.share}%</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: TEXT.muted, marginLeft: 112, marginTop: 2 }}>{c.description}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="04" label="Porter's Five Forces">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, margin: "14px 0" }}>
            {Object.entries(report.porters_five).map(([key, val]) => (
              <div key={key} style={{ textAlign: "center", padding: "12px 6px", background: BG.tertiary, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, color: fc[val.level], marginBottom: 4 }}>{val.score}</div>
                <div style={{ fontSize: 9, color: TEXT.muted, lineHeight: 1.3, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>
          {Object.entries(report.porters_five).map(([key, val]) => (
            <p key={key} style={{ fontSize: 11, color: TEXT.muted, lineHeight: 1.5, marginBottom: 4 }}>
              <strong style={{ color: TEXT.secondary, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}:</strong> {val.explanation}
            </p>
          ))}
        </Section>

        <Section num="05" label="SWOT Analysis">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "14px 0" }}>
            {Object.entries(report.swot).map(([key, items]) => (
              <div key={key} style={{ padding: 14, borderRadius: 10, border: `1px solid ${BORDER}`, background: sw[key].bg }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 700, color: sw[key].c }}>{key}</div>
                {items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: TEXT.secondary, lineHeight: 1.8 }}>→ {item}</div>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: ACCENT.green, marginBottom: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
            06 — Investment Recommendation
          </div>
          <div style={{
            display: "inline-block", padding: "4px 12px", borderRadius: 6, marginBottom: 12,
            fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace",
            background: report.recommendation.verdict.includes("Not") ? "rgba(255,107,107,0.12)" : report.recommendation.verdict.includes("Caution") ? "rgba(255,178,36,0.12)" : "rgba(0,212,170,0.12)",
            color: report.recommendation.verdict.includes("Not") ? ACCENT.red : report.recommendation.verdict.includes("Caution") ? ACCENT.amber : ACCENT.green,
          }}>{report.recommendation.verdict.toUpperCase()}</div>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, marginBottom: 10, fontWeight: 400 }}>{report.recommendation.headline}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: TEXT.secondary, marginBottom: 14 }}>{report.recommendation.body}</p>
          <div style={{ display: "flex", gap: 20 }}>
            <span style={{ fontSize: 12, color: TEXT.muted }}>Payback: <span style={{ color: ACCENT.green, fontFamily: "'DM Mono', monospace" }}>{report.recommendation.payback_period}</span></span>
            <span style={{ fontSize: 12, color: TEXT.muted }}>Margin: <span style={{ color: ACCENT.green, fontFamily: "'DM Mono', monospace" }}>{report.recommendation.expected_margin}</span></span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("Perfume and fragrance market in Nigeria");
  const [market, setMarket] = useState("Nigeria");
  const [framework, setFramework] = useState(FRAMEWORKS[0]);
  const [investment, setInvestment] = useState("$100K - $330K");
  const [region, setRegion] = useState("Lagos + Abuja");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [searches, setSearches] = useState([]);
  const [error, setError] = useState(null);

  const selStyle = {
    width: "100%", padding: "10px 14px", background: BG.tertiary, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: TEXT.primary, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
  };

  const handleGenerate = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearches([]);
    setReport(null);
    try {
      const result = await generateReport(query, market, framework, investment, region);
      setSearches(result.searches);
      setReport(result.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, market, framework, investment, region]);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ background: BG.primary, color: TEXT.primary, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        <Header />
        <div style={{ display: "flex", minHeight: "calc(100vh - 63px)" }}>
          <Sidebar market={market} setMarket={setMarket} />

          <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
            {/* SEARCH */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: TEXT.muted, fontSize: 18 }}>⌕</span>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search any industry, product, or market..."
                  style={{
                    width: "100%", padding: "15px 22px 15px 48px", background: BG.card,
                    border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT.primary,
                    fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {QUICK_TAGS.map(tag => (
                  <span key={tag} onClick={() => setQuery(tag.slice(2).trim() + " market in " + market)} style={{
                    padding: "5px 12px", background: BG.tertiary, border: `1px solid ${BORDER}`,
                    borderRadius: 20, fontSize: 11, color: TEXT.secondary, cursor: "pointer",
                  }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* CONFIG */}
            <div style={{ background: BG.card, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 19, color: TEXT.primary }}>Configure Report</span>
                <span style={{
                  background: "rgba(255,178,36,0.12)", color: ACCENT.amber,
                  padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace",
                }}>1 CREDIT = $10</span>
              </div>
              <div style={{ padding: 22 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: TEXT.muted, marginBottom: 7, fontWeight: 600 }}>Framework</label>
                    <select value={framework} onChange={e => setFramework(e.target.value)} style={selStyle}>
                      {FRAMEWORKS.map(f => <option key={f} value={f} style={{ background: BG.tertiary }}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: TEXT.muted, marginBottom: 7, fontWeight: 600 }}>Investment Range</label>
                    <select value={investment} onChange={e => setInvestment(e.target.value)} style={selStyle}>
                      <option style={{ background: BG.tertiary }} value="$30K - $100K">₦50M-₦150M ($30K-$100K)</option>
                      <option style={{ background: BG.tertiary }} value="$100K - $330K">₦150M-₦500M ($100K-$330K)</option>
                      <option style={{ background: BG.tertiary }} value="$330K+">₦500M+ ($330K+)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: TEXT.muted, marginBottom: 7, fontWeight: 600 }}>Focus Region</label>
                    <select value={region} onChange={e => setRegion(e.target.value)} style={selStyle}>
                      {["Lagos + Abuja", "Lagos Only", "South-West", "Nationwide"].map(r => (
                        <option key={r} style={{ background: BG.tertiary }} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: TEXT.muted, marginBottom: 7, fontWeight: 600 }}>Depth</label>
                    <select style={selStyle}>
                      {["Standard (8-12 pages)", "Premium + Analyst (20-30 pages)", "Enterprise Deep Dive (40+ pages)"].map(d => (
                        <option key={d} style={{ background: BG.tertiary }}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={loading} style={{
                  width: "100%", padding: 13, background: loading ? BG.tertiary : ACCENT.green,
                  color: loading ? TEXT.muted : BG.primary, border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s",
                }}>
                  {loading ? "⏳ RESEARCHING & COMPILING..." : "⚡ GENERATE MARKET INTELLIGENCE REPORT"}
                </button>
              </div>
            </div>

            {loading && <LoadingState searches={searches} />}

            {error && (
              <div style={{ background: "rgba(255,107,107,0.1)", border: `1px solid ${ACCENT.red}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ color: ACCENT.red, fontWeight: 600, marginBottom: 4 }}>Generation Failed</div>
                <div style={{ color: TEXT.secondary, fontSize: 13 }}>{error}</div>
              </div>
            )}

            {report && <ReportView report={report} />}
          </div>

          <DataPanel report={report} />
        </div>
      </div>
    </>
  );
}
