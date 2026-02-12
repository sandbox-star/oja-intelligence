export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, market, framework, investment, region } = req.body;

    const systemPrompt = `You are a senior strategy consultant at McKinsey & Company producing a market intelligence report. You must search the web extensively to find REAL data for this report. Do NOT make up numbers — search for actual statistics, companies, and market data.

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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Research and compile a comprehensive market intelligence report for: "${query}" in ${market}. Search the web extensively for real, current data. Focus on ${region}. Investment range: ${investment}. Use the ${framework} framework. Perform at least 5 different web searches to gather comprehensive data.`
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "API request failed" });
    }

    // Extract searches performed
    const searches = (data.content || [])
      .filter(b => b.type === "server_tool_use" && b.name === "web_search")
      .map(b => b.input?.query || "Searching...");

    // Extract text content
    const textBlocks = (data.content || []).filter(b => b.type === "text");
    const fullText = textBlocks.map(b => b.text).join("");

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Could not parse report data" });
    }

    const cleaned = jsonMatch[0].replace(/```json|```/g, "").trim();
    const report = JSON.parse(cleaned);

    return res.status(200).json({ report, searches });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
