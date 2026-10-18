"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";

type Plot = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type Drawing = Plot & {
  kind: "zone" | "line" | "arrow" | "band";
  category: string;
  label: string;
  price: string;
  note: string;
};

type Result = {
  analysis: string;
  score: number | null;
  decision: string;
  warnings: string[];
  plot: Plot;
  drawings: Drawing[];
};

const groups = [
  { id: "zones", label: "المناطق" },
  { id: "structure", label: "الهيكل" },
  { id: "liquidity", label: "السيولة" },
  { id: "trade", label: "خطة التداول" },
  { id: "paths", label: "السيناريوهات" },
  { id: "time", label: "Killzone" },
];

function groupOf(category: string) {
  if (["supply", "demand", "fvg", "ob"].includes(category)) {
    return "zones";
  }
  if (["bos", "mss"].includes(category)) return "structure";
  if (["bsl", "ssl", "sweep"].includes(category)) return "liquidity";
  if (["entry", "stop", "target"].includes(category)) return "trade";
  if (category === "killzone") return "time";
  return "paths";
}

const colors: Record<string, string> = {
  supply: "#ef4444",
  demand: "#10b981",
  fvg: "#a855f7",
  ob: "#f59e0b",
  bos: "#0284c7",
  mss: "#db2777",
  bsl: "#0891b2",
  ssl: "#d97706",
  sweep: "#e11d48",
  entry: "#2563eb",
  stop: "#dc2626",
  target: "#059669",
  scenario: "#ca8a04",
  alternative: "#7c3aed",
  killzone: "#6366f1",
};

const panel: CSSProperties = {
  background: "rgba(255,255,255,.045)",
  border: "1px solid #263244",
  borderRadius: 20,
  padding: 18,
};

const button: CSSProperties = {
  border: "1px solid #354155",
  borderRadius: 12,
  background: "#131c2b",
  color: "#e5edf8",
  padding: "12px 16px",
  cursor: "pointer",
  font: "inherit",
};

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const [image, setImage] = useState("");
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [show, setShow] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((group) => [group.id, true]))
  );

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || busyRef.current) return;

    setError("");

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("اختر صورة PNG أو JPG أو WEBP.");
      return;
    }

    if (file.size > 2_000_000) {
      setError("اختر صورة أقل من 2 ميغابايت.");
      return;
    }

    busyRef.current = true;
    setReading(true);
    setResult(null);
    setSelected(null);
    setImage("");

    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("file"));
        reader.readAsDataURL(file);
      });

      const dimensions = await new Promise<{
        width: number;
        height: number;
      }>((resolve, reject) => {
        const picture = new Image();

        picture.onload = () => {
          if (!picture.naturalWidth || !picture.naturalHeight) {
            reject(new Error("dimensions"));
            return;
          }

          resolve({
            width: picture.naturalWidth,
            height: picture.naturalHeight,
          });
        };

        picture.onerror = () => reject(new Error("image"));
        picture.src = url;
      });

      setSize(dimensions);
      setImage(url);
      setZoom(1);
      setShow(true);
    } catch {
      setError("تعذر قراءة الصورة. جرّب ملفاً آخر.");
    } finally {
      busyRef.current = false;
      setReading(false);
    }
  }

  async function analyze() {
    if (!image || busyRef.current) return;

    busyRef.current = true;
    setLoading(true);
    setError("");
    setResult(null);
    setSelected(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || `تعذر التحليل. رمز الخطأ: ${response.status}`
        );
      }

      if (
        !data ||
        typeof data.analysis !== "string" ||
        !data.plot ||
        !Array.isArray(data.drawings)
      ) {
        throw new Error(
          "الصفحة وواجهة التحليل غير متوافقتين. تأكد من نشر الملفين معاً."
        );
      }

      setResult(data as Result);
      setShow(true);
      setVisible(
        Object.fromEntries(groups.map((group) => [group.id, true]))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذر الاتصال بخدمة التحليل."
      );
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  const width = 1000;
  const height = (size.height / size.width) * width;
  const X = (n: number) => (n / 100) * width;
  const Y = (n: number) => (n / 100) * height;

  const drawings = result?.drawings || [];

  const active = drawings
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item, index }) =>
        show &&
        visible[groupOf(item.category)] &&
        (selected === null || selected === index)
    );

  const locked = loading || reading;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top,#12273c 0%,#080d17 55%)",
        color: "#e5edf8",
        fontFamily: "system-ui, sans-serif",
        padding: "0 12px 32px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          maxWidth: 1150,
          margin: "auto",
          padding: "22px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid #263244",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#34d399,#3b82f6)",
            color: "#07121b",
            borderRadius: 14,
            padding: 14,
            fontWeight: 900,
          }}
        >
          FX
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 21 }}>FX Volume AI</div>
          <div style={{ color: "#99abc2", fontSize: 12 }}>
            قراءة بصرية للشارت · تحليل تعليمي
          </div>
        </div>
      </header>

      <section
        style={{
          textAlign: "center",
          maxWidth: 850,
          margin: "auto",
          padding: "34px 10px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(25px,5vw,42px)",
            margin: "0 0 12px",
          }}
        >
          اقرأ الشارت، وشاهد الفكرة
          <span style={{ color: "#34d399" }}> بوضوح</span>
        </h1>
        <p style={{ color: "#a9b8ca", lineHeight: 1.9, margin: 0 }}>
          مناطق وهيكل وسيولة وخطة مشروطة، مع تحكم في كل طبقة رسم.
          الرسومات تقديرية وتحتاج مراجعتك.
        </p>
      </section>

      <section style={{ ...panel, maxWidth: 1110, margin: "auto" }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={chooseImage}
          disabled={locked}
          style={{ display: "none" }}
          aria-label="اختيار صورة الشارت"
        />

        {!image && (
          <button
            type="button"
            disabled={locked}
            onClick={() => inputRef.current?.click()}
            style={{
              ...button,
              width: "100%",
              padding: "55px 16px",
              border: "2px dashed #3c6171",
              background: "rgba(16,185,129,.045)",
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 12 }}>＋</div>
            <div style={{ fontSize: 18 }}>
              {reading ? "جارٍ قراءة الصورة…" : "اختر صورة الشارت"}
            </div>
            <div style={{ color: "#99abc2", marginTop: 10, fontSize: 13 }}>
              PNG · JPG · WEBP — أقل من 2 ميغابايت
            </div>
          </button>
        )}

        {image && (
          <>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                disabled={locked}
                onClick={() => inputRef.current?.click()}
                style={{ ...button, opacity: locked ? 0.5 : 1 }}
              >
                تغيير الصورة
              </button>

              <button
                type="button"
                disabled={locked}
                onClick={analyze}
                style={{
                  ...button,
                  background: "linear-gradient(90deg,#34d399,#3b82f6)",
                  color: "#061321",
                  fontWeight: 800,
                  opacity: locked ? 0.5 : 1,
                }}
              >
                {loading ? "جارٍ التحليل…" : "حلّل الشارت"}
              </button>

              {result && (
                <>
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    style={button}
                  >
                    {show ? "إخفاء الرسومات" : "إظهار الرسومات"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      setShow(true);
                      setVisible(
                        Object.fromEntries(
                          groups.map((group) => [group.id, true])
                        )
                      );
                    }}
                    style={button}
                  >
                    عرض الكل
                  </button>
                </>
              )}
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
                color: "#b9c7d8",
              }}
            >
              تكبير الشارت
              <input
                type="range"
                min="1"
                max="3"
                step="0.25"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
              <span>{Math.round(zoom * 100)}%</span>
            </label>

            <div
              dir="ltr"
              style={{
                overflow: "auto",
                borderRadius: 14,
                border: "1px solid #354155",
                background: "#101722",
              }}
            >
              <div style={{ width: `${zoom * 100}%` }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={`0 0 ${width} ${height}`}
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label="صورة الشارت مع عناصر التحليل المرقمة"
                  style={{ width: "100%", height: "auto", display: "block" }}
                >
                  <defs>
                    <marker
                      id="fx-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="10"
                      markerHeight="10"
                      orient="auto-start-reverse"
                      markerUnits="userSpaceOnUse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" />
                    </marker>

                    {result && (
                      <clipPath id="fx-plot">
                        <rect
                          x={X(result.plot.x1)}
                          y={Y(result.plot.y1)}
                          width={X(result.plot.x2 - result.plot.x1)}
                          height={Y(result.plot.y2 - result.plot.y1)}
                        />
                      </clipPath>
                    )}
                  </defs>

                  <image
                    href={image}
                    x="0"
                    y="0"
                    width={width}
                    height={height}
                    preserveAspectRatio="none"
                  />

                  <g clipPath={result ? "url(#fx-plot)" : undefined}>
                    {active.map(({ item, index }) => {
                      const color = colors[item.category] || "#2563eb";
                      const x1 = X(item.x1);
                      const y1 = Y(item.y1);
                      const x2 = X(item.x2);
                      const y2 = Y(item.y2);
                      const area =
                        item.kind === "zone" || item.kind === "band";

                      const alternate = item.category === "alternative";
                      const emphasis = selected === index;

                      return (
                        <g key={index}>
                          <title>
                            {`${index + 1}. ${item.label} — ${item.price} — ${item.note}`}
                          </title>

                          {area ? (
                            <rect
                              x={Math.min(x1, x2)}
                              y={Math.min(y1, y2)}
                              width={Math.abs(x2 - x1)}
                              height={Math.abs(y2 - y1)}
                              fill={color}
                              fillOpacity={emphasis ? 0.2 : 0.08}
                              stroke={color}
                              strokeWidth={emphasis ? 3 : 1.5}
                              strokeDasharray={
                                item.kind === "band" ? "5 5" : undefined
                              }
                            />
                          ) : (
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={color}
                              strokeWidth={emphasis ? 3.5 : 2}
                              strokeDasharray={
                                alternate
                                  ? "9 7"
                                  : item.kind === "arrow"
                                    ? "6 4"
                                    : undefined
                              }
                              markerEnd={
                                item.kind === "arrow"
                                  ? "url(#fx-arrow)"
                                  : undefined
                              }
                            />
                          )}

                          <g
                            onClick={() =>
                              setSelected(selected === index ? null : index)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <circle
                              cx={x1 + (area ? 13 : 0)}
                              cy={y1 + (area ? 13 : 0)}
                              r={11}
                              fill="#0a1220"
                              stroke={color}
                              strokeWidth={2}
                            />
                            <text
                              x={x1 + (area ? 13 : 0)}
                              y={y1 + (area ? 13 : 0)}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize="12"
                              fontWeight="700"
                              fontFamily="system-ui, sans-serif"
                              fill="#ffffff"
                            >
                              {index + 1}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>

            {result && (
              <p style={{ color: "#a5b6ca", fontSize: 13, lineHeight: 1.8 }}>
                الأرقام تربط الرسم بالبطاقات أسفله. إذا تداخلت العلامات،
                اضغط بطاقة العنصر لعرضه منفرداً. التكبير وإخفاء الطبقات
                لا يرسلان طلب تحليل جديد.
              </p>
            )}
          </>
        )}

        {loading && (
          <p role="status" style={{ color: "#6ee7b7", lineHeight: 1.8 }}>
            جارٍ قراءة الصورة وتحديد العناصر… لا توجد إعادة محاولة تلقائية.
          </p>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: 15,
              background: "#331b25",
              border: "1px solid #864052",
              color: "#fecdd3",
              borderRadius: 12,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              lineHeight: 1.8,
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                margin: "22px 0",
              }}
            >
              <div style={{ ...panel, flex: "1 1 180px" }}>
                <div style={{ color: "#9fb1c8", fontSize: 13 }}>
                  تقييم وصفي — ليس احتمال نجاح
                </div>
                <div
                  style={{
                    color: "#6ee7b7",
                    fontSize: 30,
                    fontWeight: 800,
                    marginTop: 7,
                  }}
                >
                  {result.score === null ? "غير محدد" : `${result.score}/100`}
                </div>
              </div>

              <div style={{ ...panel, flex: "1 1 180px" }}>
                <div style={{ color: "#9fb1c8", fontSize: 13 }}>القرار</div>
                <div style={{ fontSize: 23, marginTop: 9 }}>
                  {result.decision}
                </div>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div
                style={{
                  ...panel,
                  borderColor: "#8a6728",
                  color: "#fde68a",
                  marginBottom: 20,
                }}
              >
                <div>قيود القراءة والتنبيهات</div>
                <ul style={{ lineHeight: 1.9, marginBottom: 0 }}>
                  {result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <h2 style={{ fontSize: 20 }}>طبقات الرسم</h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {groups.map((group) => (
                <label
                  key={group.id}
                  style={{
                    ...button,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visible[group.id]}
                    onChange={() => {
                      setSelected(null);
                      setVisible((old) => ({
                        ...old,
                        [group.id]: !old[group.id],
                      }));
                    }}
                  />
                  {group.label}
                </label>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 10,
              }}
            >
              {drawings.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => {
                    setShow(true);
                    setVisible((old) => ({
                      ...old,
                      [groupOf(item.category)]: true,
                    }));
                    setSelected(selected === index ? null : index);
                  }}
                  style={{
                    ...button,
                    textAlign: "right",
                    borderColor:
                      selected === index
                        ? colors[item.category]
                        : "#354155",
                    background:
                      selected === index ? "#1d2c42" : "#101826",
                    lineHeight: 1.8,
                  }}
                >
                  <div
                    style={{
                      color: colors[item.category] || "#93c5fd",
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}. {item.label}
                  </div>
                  <div style={{ color: "#f1f5f9" }}>{item.price}</div>
                  <div style={{ color: "#a9b8ca", fontSize: 12 }}>
                    {item.note}
                  </div>
                </button>
              ))}
            </div>

            {drawings.length === 0 && (
              <p style={{ color: "#fcd34d" }}>
                لم تُحدَّد عناصر صالحة للرسم. راجع التنبيهات والتحليل.
              </p>
            )}

            <h2 style={{ fontSize: 20, marginTop: 28 }}>نتيجة التحليل</h2>

            <div
              style={{
                ...panel,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                lineHeight: 2,
                background: "#0a1220",
              }}
            >
              {result.analysis}
            </div>
          </>
        )}
      </section>

      <section
        style={{
          ...panel,
          maxWidth: 1110,
          margin: "22px auto",
          textAlign: "center",
          background:
            "linear-gradient(100deg,rgba(16,185,129,.1),rgba(59,130,246,.1))",
        }}
      >
        <div style={{ fontSize: 21, fontWeight: 800 }}>
          FX Volume — افهم السيولة، وراجع الفكرة
        </div>
        <p style={{ color: "#a7b8cc", lineHeight: 1.9, marginBottom: 0 }}>
          أداة بصرية تعليمية، وليست وعداً بالربح أو بديلاً عن التحقق
          من الأسعار وإدارة المخاطر.
        </p>
      </section>
    </main>
  );
}
