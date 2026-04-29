import { useState, useRef, useEffect } from "react";

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Ты — старший аналитик рынка коммерческой и жилой недвижимости Узбекистана с 15-летним опытом. Анализируешь объявления о продаже и аренде с точностью профессионального оценщика.

ТВОИ ЗНАНИЯ (актуальные данные 2024-2025):

ЖИЛАЯ НЕДВИЖИМОСТЬ — цены продажи ($/кв.м):
- Мирабад, Яккасарай (центр, 1 линия Амира Тимура): $1800-3500
- Шайхантахур, Бектемир: $1400-2200
- Юнусабад (все кварталы): $900-1600
- Мирзо-Улугбек: $850-1400
- Чиланзар: $750-1150
- Алмазар, Хамза: $700-1050
- Сергели, Учтепа, Яшнабад: $520-820

КОММЕРЧЕСКАЯ НЕДВИЖИМОСТЬ — цены продажи ($/кв.м):
- 1 линия Амира Тимура, Бродвей, Сквер: $4000-8000
- Центр (Мирабад, Яккасарай): $2500-5000
- Юнусабад 1-18 кварталы: $1500-2800
- Чиланзар, Алмазар: $1000-1800
- Сергели, окраины: $600-1100
- Новые ЖК (New Life, Origin и тд): $1200-2500

КОММЕРЧЕСКАЯ АРЕНДА ($/кв.м/мес):
- 1 линия центр (Амира Тимура, Навои): $25-60
- Центр (Мирабад, Яккасарай): $18-35
- Юнусабад: $12-22
- Чиланзар, Алмазар: $8-15
- Сергели, окраины: $4-8

ЖИЛАЯ АРЕНДА ($/мес):
- 1-комн центр: $400-800, окраина: $180-320
- 2-комн центр: $650-1400, окраина: $280-550
- 3-комн центр: $1000-2000, окраина: $450-750

КЛЮЧЕВЫЕ ОРИЕНТИРЫ ТАШКЕНТА (влияют на цену):
- Бродвей, Сквер, Амира Тимура — премиум +30-50%
- Пирамид (Яккасарай) — хорошая локация
- Yunusabad Plaza, Riviera — престижные ЖК +15-25%
- New Life, Origin, Capitol — современные ЖК +10-20%
- Рядом с метро — +10-15%
- 1 линия дороги — +20-40% к аренде, +10-20% к продаже
- Угловое помещение — +5-10%

ПАРАМЕТРЫ ВЛИЯЮЩИЕ НА ЦЕНУ:
- Потолки коммерции: стандарт 3-3.5м. 4м+ = +10%, 5м+ = +20%
- Паркинг у коммерции = +10-15%
- Состояние "коробка/черновая" = -15-25% от готового
- Евроремонт/дизайн = +10-20%
- 1 этаж коммерции = максимальная ликвидность
- Подвал/цоколь = -30-40%
- Первый и последний этаж жилья = -5-10%

ТВОЯ ЗАДАЧА:
1. Извлечь ВСЕ параметры из объявления
2. Оценить реальную рыночную стоимость с учётом локации и характеристик
3. Выявить скрытые плюсы и риски
4. Дать инвестиционную рекомендацию

ОБЯЗАТЕЛЬНО верни ТОЛЬКО валидный JSON без markdown, без пояснений:
{
  "verdict": "ВЫГОДНО" | "НОРМА" | "ПЕРЕОЦЕНЕНО" | "НЕДООЦЕНЕНО",
  "score": <1-10>,
  "type": "Жильё" | "Коммерция" | "Аренда",
  "district": "<название района>",
  "area_total": <число кв.м или null>,
  "area_breakdown": "<описание если несколько, например '213+349+60'>" | null,
  "price_total": <число $ или null>,
  "price_per_sqm": <число $ или null>,
  "market_price_per_sqm_min": <число>,
  "market_price_per_sqm_max": <число>,
  "deviation_pct": <число, отрицательное = дешевле рынка>,
  "monthly_rent_estimate": <число $ или null>,
  "annual_yield_pct": <число или null>,
  "payback_years": <число или null>,
  "ceiling_height": <число метров или null>,
  "floor_info": "<этаж>" | null,
  "location_premium": "<описание бонуса локации>" | null,
  "key_factors": ["фактор1", "фактор2", "фактор3"],
  "pros": ["плюс1", "плюс2", "плюс3"],
  "cons": ["минус1", "минус2"],
  "hidden_risks": ["риск1"] | [],
  "recommendation": "<2-3 предложения конкретной рекомендации>",
  "negotiation": "<конкретный совет по торгу с цифрами>",
  "fair_price_estimate": <справедливая цена в $ или null>
}`;

// ─── EXAMPLES ──────────────────────────────────────────────────────────────────
const EXAMPLES = [
  {
    label: "Коммерция · Яккасарай · $2.7M",
    text: `Продажа коммерческой недвижимости - Вдоль дороги
Адрес: Яккасарайский район, ориентир: Пирамид, Первая линия
Характеристики:
Этаж: 1+2+терасса
Площадь: 213 + 349 + 60 м²
Количество комнат: Open space
Состояние: Коробка
Дополнительно: Паркинг
Продажа: 2.700.000 $ (Торг)`,
  },
  {
    label: "Коммерция · Мирабад · $345K",
    text: `Продаётся угловое коммерческое помещение в ЖК New Life Mirabad.
Мирабадский район, 1 этаж
Площадь: 280 м²
Потолки: 4.15 м
Подходит под магазин, клинику, шоурум, офис, кафе
Цена: 345000 у.е. Торг
1 м² = 1240 у.е.`,
  },
  {
label: "Квартира · Юнусабад · $95K",
    text: `Продаётся 2-комнатная квартира в Юнусабаде, 18 квартал.
58 кв.м, 7/9 этаж, евроремонт, новый дом 2021г.
Цена $95,000. Торг уместен.`,
  },
  {
    label: "Аренда · Чиланзар · $600/мес",
    text: `Сдаётся 3-комнатная квартира в Чиланзаре, 7 квартал.
72 кв.м, мебель и техника, 3/5 этаж, хорошее состояние. $600/месяц`,
  },
];

// ─── SCORE RING ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const r = 28, circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  const color = score >= 7 ? "#4ADE80" : score >= 5 ? "#FACC15" : "#F87171";
  const shadow = "drop-shadow(0 0 6px " + color + "88)";
  const dasharray = fill + " " + circ;
  return (
    <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1E1E1E" strokeWidth="5" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={dasharray} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease", filter: shadow }} />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg) translate(0, -72px)", transformOrigin: "36px 36px", fill: color, fontSize: 20, fontWeight: 900, fontFamily: "serif" }}>
        {score}
      </text>
    </svg>
  );
};

// ─── DEVIATION BAR ─────────────────────────────────────────────────────────────
const DeviationBar = ({ pct }) => {
  if (pct === null || pct === undefined) return null;
  const clamped = Math.max(-60, Math.min(60, pct));
  const pos = 50 + clamped * 0.7;
  const color = clamped < -8 ? "#4ADE80" : clamped > 8 ? "#F87171" : "#FACC15";
  const barWidth = pos + "%";
  const barBg = "linear-gradient(90deg, #4ADE80 0%, " + color + " 100%)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: "#555" }}>ОТКЛОНЕНИЕ ОТ РЫНКА</span>
        <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "serif" }}>
          {pct > 0 ? "+" : ""}{Math.round(pct)}%
        </span>
      </div>
      <div style={{ position: "relative", height: 6, background: "#1A1A1A", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#333" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: barWidth, height: "100%", background: barBg, borderRadius: 3, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>ДЕШЕВЛЕ</span>
        <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>ДОРОЖЕ</span>
      </div>
    </div>
  );
};

// ─── STAT TILE ─────────────────────────────────────────────────────────────────
const Tile = ({ label, value, accent, sub }) => (
  <div style={{ background: "#111", border: "1px solid #1C1C1C", borderRadius: 14, padding: "14px 16px", flex: 1 }}>
    <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 900, color: accent  "#E8E8E8", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{value  "—"}</div>
    {sub && <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home | loading | result
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadMsg, setLoadMsg] = useState("");
  const loadRef = useRef(null);

  const LOAD_MSGS = [
    "Определяю район и локацию...",
    "Анализирую цену за кв.м...",
"Сравниваю с рынком...",
    "Считаю доходность...",
    "Формирую рекомендацию...",
  ];

  const analyze = async () => {
    if (!text.trim()) return;
    setError("");
    setScreen("loading");
    setLoadMsg(LOAD_MSGS[0]);

    let msgIdx = 0;
    loadRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOAD_MSGS.length;
      setLoadMsg(LOAD_MSGS[msgIdx]);
    }, 1800);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: "Проанализируй объявление:\n\n" + text }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setScreen("result");
    } catch {
      setError("Ошибка анализа. Попробуй снова или добавь больше деталей.");
      setScreen("home");
    } finally {
      clearInterval(loadRef.current);
    }
  };

  const reset = () => { setScreen("home"); setResult(null); setText(""); setError(""); };

  const verdictCfg = {
    "ВЫГОДНО":     { color: "#4ADE80", bg: "#0A1F0E", icon: "✦" },
    "НЕДООЦЕНЕНО": { color: "#4ADE80", bg: "#0A1F0E", icon: "◆" },
    "НОРМА":       { color: "#FACC15", bg: "#1A1600", icon: "◈" },
    "ПЕРЕОЦЕНЕНО": { color: "#F87171", bg: "#1F0A0A", icon: "▲" },
  };
  const vc = result ? (verdictCfg[result.verdict] || verdictCfg["НОРМА"]) : {};

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          {screen !== "home" && (
            <button onClick={reset} style={S.backBtn}>←</button>
          )}
          <div style={{ flex: 1 }}>
            <div style={S.logoWord}>
              {"IMKON".split("").map((c, i) => (
                <span key={i} style={{ ...S.logoLetter, animationDelay: (i * 0.08) + "s" }}>{c}</span>
              ))}
              <span style={S.logoDot}>.</span>
            </div>
            <div style={S.logoSub}>Анализатор недвижимости · Узбекистан</div>
          </div>
          <div style={S.headerBadge}>AI</div>
        </div>
        <div style={S.headerLine} />
      </header>

      {/* ── HOME ── */}
      {screen === "home" && (
        <div style={S.body} className="fadein">
          <div style={S.heroSection}>
            <div style={S.heroTag}>ПРОФЕССИОНАЛЬНАЯ ОЦЕНКА</div>
            <h1 style={S.heroTitle}>Вставь текст<br />объявления</h1>
            <p style={S.heroSub}>ИИ проанализирует локацию, цену, параметры и сравнит с рынком Ташкента</p>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"Вставь объявление с OLX.uz или опиши объект вручную...\n\nПример: Продаётся коммерческое помещение в Яккасарае..."}
            style={S.textarea}
          />

          {error && <div style={S.errorBox}>{error}</div>}

          <button
            onClick={analyze}
            disabled={!text.trim()}
            style={{ ...S.analyzeBtn, opacity: text.trim() ? 1 : 0.35 }}
            className="abtn"
          >
            <span style={S.analyzeBtnIcon}>⚡</span>
            Анализировать
          </button>

          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>примеры</span>
            <div style={S.dividerLine} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} style={S.exBtn} className="exbtn" onClick={() => setText(ex.text)}>
                <div style={S.exBtnDot} />
                <div>
                  <div style={S.exBtnLabel}>{ex.label}</div>
<div style={S.exBtnPreview}>{ex.text.slice(0, 60)}...</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── LOADING ── */}
      {screen === "loading" && (
        <div style={S.loadingScreen} className="fadein">
          <div style={S.loadingOrb} className="pulse-orb" />
          <div style={S.loadingText}>{loadMsg}</div>
          <div style={S.loadingDots}>
            {[0,1,2].map(i => <div key={i} style={{ ...S.dot, animationDelay: (i*0.25) + "s" }} />)}
          </div>
          <div style={S.loadingCaption}>Анализирую параметры объявления</div>
        </div>
      )}

      {/* ── RESULT ── */}
      {screen === "result" && result && (
        <div style={S.body} className="fadein">

          {/* Verdict hero */}
          <div style={{ ...S.verdictCard, background: vc.bg, borderColor: vc.color + "22" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 6 }}>ВЕРДИКТ</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: vc.color, fontFamily: "'Cormorant Garamond', serif", letterSpacing: 2, lineHeight: 1 }}>
                {vc.icon} {result.verdict}
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                {result.type} · {result.district}
              </div>
            </div>
            <ScoreRing score={result.score} />
          </div>

          {/* Tags row */}
          <div style={S.tagsRow}>
            {[
              result.area_total && (result.area_total.toLocaleString() + " кв.м"),
              result.floor_info && ("Этаж: " + result.floor_info),
              result.ceiling_height && ("Потолки: " + result.ceiling_height + "м"),
              result.location_premium,
            ].filter(Boolean).map((t, i) => (
              <span key={i} style={S.tag}>{t}</span>
            ))}
          </div>

          {/* Price stats */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Tile
              label="Цена за кв.м"
              value={result.price_per_sqm ? ("$" + result.price_per_sqm.toLocaleString()) : "—"}
            />
            <Tile
              label="Рынок (диапазон)"
              value={result.market_price_per_sqm_min ? ("$" + result.market_price_per_sqm_min.toLocaleString() + "–" + result.market_price_per_sqm_max?.toLocaleString()) : "—"}
              accent="#C8A96E"
            />
          </div>

          {/* Total price + fair price */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Tile
              label="Цена сделки"
              value={result.price_total ? ("$" + result.price_total.toLocaleString()) : "—"}
            />
            {result.fair_price_estimate && (
              <Tile
                label="Справедливая цена"
                value={"$" + result.fair_price_estimate.toLocaleString()}
                accent="#C8A96E"
              />
            )}
          </div>

          {/* Deviation */}
          <div style={S.card}>
            <DeviationBar pct={result.deviation_pct} />
          </div>

          {/* Yield row */}
          {result.monthly_rent_estimate && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Tile label="Аренда/мес" value={"$" + result.monthly_rent_estimate.toLocaleString()} accent="#4ADE80" />
              <Tile label="Доходность" value={result.annual_yield_pct ? (result.annual_yield_pct + "%") : "—"} accent="#4ADE80" />
              <Tile label="Окупаемость" value={result.payback_years ? (result.payback_years + " л.") : "—"} />
            </div>
          )}

          {/* Key factors */}
          {result.key_factors?.length > 0 && (
            <div style={S.card}>
              <div style={S.cardLabel}>КЛЮЧЕВЫЕ ФАКТОРЫ</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.key_factors.map((f, i) => (
<span key={i} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#AAA", fontSize: 12, padding: "5px 10px", borderRadius: 20 }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Pros / Cons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ ...S.listCard, flex: 1, borderColor: "#4ADE8015" }}>
              <div style={{ fontSize: 9, color: "#4ADE80", letterSpacing: 2, marginBottom: 10 }}>ПЛЮСЫ</div>
              {result.pros?.map((p, i) => (
                <div key={i} style={S.listItem}><span style={{ color: "#4ADE80", marginRight: 6, flexShrink: 0 }}>+</span>{p}</div>
              ))}
            </div>
            <div style={{ ...S.listCard, flex: 1, borderColor: "#F8717115" }}>
              <div style={{ fontSize: 9, color: "#F87171", letterSpacing: 2, marginBottom: 10 }}>МИНУСЫ</div>
              {result.cons?.map((c, i) => (
                <div key={i} style={S.listItem}><span style={{ color: "#F87171", marginRight: 6, flexShrink: 0 }}>−</span>{c}</div>
              ))}
            </div>
          </div>

          {/* Hidden risks */}
          {result.hidden_risks?.length > 0 && (
            <div style={{ ...S.card, borderColor: "#FACC1520", background: "#12100A" }}>
              <div style={{ fontSize: 9, color: "#FACC15", letterSpacing: 2, marginBottom: 10 }}>⚠ СКРЫТЫЕ РИСКИ</div>
              {result.hidden_risks.map((r, i) => (
                <div key={i} style={{ ...S.listItem, color: "#BBB" }}><span style={{ color: "#FACC15", marginRight: 6 }}>!</span>{r}</div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          <div style={{ ...S.card, background: "#0D0B00", borderColor: "#C8A96E20" }}>
            <div style={{ fontSize: 9, color: "#C8A96E", letterSpacing: 2, marginBottom: 10 }}>💡 РЕКОМЕНДАЦИЯ</div>
            <div style={{ fontSize: 13, color: "#DDD", lineHeight: 1.7 }}>{result.recommendation}</div>
          </div>

          {/* Negotiation */}
          <div style={{ ...S.card, background: "#0D0800", borderColor: "#F9731620" }}>
            <div style={{ fontSize: 9, color: "#F97316", letterSpacing: 2, marginBottom: 8 }}>🤝 ТОРГ</div>
            <div style={{ fontSize: 13, color: "#CCC", lineHeight: 1.65 }}>{result.negotiation}</div>
          </div>

          <button onClick={reset} style={S.resetBtn} className="resetbtn">← Новый анализ</button>
        </div>
      )}
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  root: { display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: 430, margin: "0 auto", background: "#080808", fontFamily: "'Instrument Sans', sans-serif", color: "#E0E0E0" },
  header: { padding: "0 20px", background: "#080808", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 },
  headerInner: { display: "flex", alignItems: "center", gap: 12, paddingTop: 16, paddingBottom: 12 },
  backBtn: { background: "none", border: "1px solid #222", color: "#888", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoWord: { display: "flex", alignItems: "baseline", gap: 0 },
  logoLetter: { fontSize: 22, fontWeight: 900, color: "#F0F0F0", fontFamily: "'Cormorant Garamond', serif", letterSpacing: 3, display: "inline-block", animation: "letterIn 0.5s ease both" },
  logoDot: { fontSize: 28, color: "#F97316", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 },
  logoSub: { fontSize: 9, color: "#444", letterSpacing: 1.5, marginTop: 1 },
  headerBadge: { background: "#F9731615", border: "1px solid #F9731640", color: "#F97316", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, letterSpacing: 2 },
  headerLine: { height: 1, background: "linear-gradient(90deg, transparent, #1E1E1E 20%, #1E1E1E 80%, transparent)", marginBottom: 0 },
  body: { flex: 1, padding: "20px 18px 40px", overflowY: "auto" },
heroSection: { marginBottom: 24 },
  heroTag: { fontSize: 9, color: "#F97316", letterSpacing: 3, marginBottom: 12, fontWeight: 700 },
  heroTitle: { fontSize: 34, fontWeight: 900, color: "#F0F0F0", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, marginBottom: 10 },
  heroSub: { fontSize: 13, color: "#555", lineHeight: 1.6 },

  textarea: { width: "100%", minHeight: 148, background: "#0F0F0F", border: "1px solid #1C1C1C", borderRadius: 16, padding: "14px 16px", color: "#D0D0D0", fontSize: 13, fontFamily: "'Instrument Sans', sans-serif", resize: "vertical", outline: "none", lineHeight: 1.65, marginBottom: 14, boxSizing: "border-box" },
  errorBox: { background: "#1F0808", border: "1px solid #F8717130", color: "#F87171", borderRadius: 12, padding: "12px 14px", fontSize: 13, marginBottom: 12 },

  analyzeBtn: { width: "100%", padding: "17px", background: "#F97316", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Instrument Sans', sans-serif", letterSpacing: 0.5, marginBottom: 28, transition: "all 0.2s" },
  analyzeBtnIcon: { fontSize: 18 },

  divider: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, background: "#1A1A1A" },
  dividerText: { fontSize: 10, color: "#333", letterSpacing: 2 },

  exBtn: { width: "100%", background: "#0C0C0C", border: "1px solid #181818", borderRadius: 12, padding: "13px 14px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12, fontFamily: "'Instrument Sans', sans-serif", transition: "all 0.18s" },
  exBtnDot: { width: 6, height: 6, borderRadius: "50%", background: "#F97316", flexShrink: 0, marginTop: 5 },
  exBtnLabel: { fontSize: 13, color: "#CCC", fontWeight: 600, marginBottom: 3 },
  exBtnPreview: { fontSize: 11, color: "#444", lineHeight: 1.4 },

  // Loading
  loadingScreen: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 40 },
  loadingOrb: { width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, #F97316 0%, #C2410C 60%, transparent 100%)", filter: "blur(1px)" },
  loadingText: { fontSize: 14, color: "#888", letterSpacing: 1, textAlign: "center", minHeight: 20 },
  loadingDots: { display: "flex", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#F97316", animation: "dotPulse 1.2s ease-in-out infinite" },
  loadingCaption: { fontSize: 11, color: "#333", letterSpacing: 1.5 },

  // Result
  verdictCard: { border: "1.5px solid", borderRadius: 18, padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  tagsRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tag: { background: "#141414", border: "1px solid #222", color: "#999", fontSize: 11, padding: "5px 11px", borderRadius: 20 },
  card: { background: "#0F0F0F", border: "1px solid #1A1A1A", borderRadius: 14, padding: "16px", marginBottom: 8 },
  cardLabel: { fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" },
  listCard: { background: "#0F0F0F", border: "1px solid", borderRadius: 14, padding: "14px 13px" },
  listItem: { fontSize: 12, color: "#AAA", lineHeight: 1.55, marginBottom: 7, display: "flex", alignItems: "flex-start" },
  resetBtn: { width: "100%", marginTop: 12, background: "transparent", border: "1px solid #1E1E1E", color: "#555", padding: "14px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontFamily: "'Instrument Sans', sans-serif", transition: "all 0.2s" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;900&family=Instrument+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; }

  @keyframes fadein { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes letterIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes dotPulse { 0%,100% { opacity:.2; transform:scale(.7); } 50% { opacity:1; transform:scale(1); } }
  @keyframes orbPulse { 0%,100% { transform:scale(1); opacity:.9; } 50% { transform:scale(1.15); opacity:1; } }

  .fadein { animation: fadein 0.35s ease; }
  .pulse-orb { animation: orbPulse 2s ease-in-out infinite; }

  .abtn:hover:not(:disabled) { background: #EA6A00 !important; transform: translateY(-1px); box-shadow: 0 10px 30px #F9731640; }
  .exbtn:hover { border-color: #F9731625 !important; background: #110900 !important; }
  .exbtn:hover .exbtn-dot { background: #F97316; }
  .resetbtn:hover { color: #AAA !important; border-color: #333 !important; }

  textarea:focus { border-color: #F9731630 !important; box-shadow: 0 0 0 2px #F9731610; }
  textarea::placeholder { color: #282828; line-height: 1.65; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1E1E1E; border-radius: 2px; }
