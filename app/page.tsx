"use client";

import { useState, useRef, useEffect } from "react";

type Zone = { x1: number; y1: number; x2: number; y2: number; label: string };
type Line = { y: number; label: string };
type Annotations = {
  direction?: string;
  supplyZones?: Zone[];
  demandZones?: Zone[];
  fvgs?: Zone[];
  orderBlocks?: Zone[];
  entry?: Line;
  stopLoss?: Line;
  targets?: Line[];
  arrow?: { x1: number; y1: number; x2: number; y2: number };
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [annotations, setAnnotations] = useState<Annotations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setAnalysis("");
      setAnnotations(null);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !annotations) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = Math.max(2, canvas.width / 400);
    ctx.font = `${Math.max(14, canvas.width / 45)}px sans-serif`;

    const drawZone = (z: Zone, color: string) => {
      const x = (z.x1 / 100) * canvas.width;
      const y = (z.y1 / 100) * canvas.height;
      const w = ((z.x2 - z.x1) / 100) * canvas.width;
      const h = ((z.y2 - z.y1) / 100) * canvas.height;
      ctx.fillStyle = color + "33";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);
      if (z.label) {
        ctx.fillStyle = color;
        ctx.fillText(z.label, x + 6, y + 22);
      }
    };

    annotations.supplyZones?.forEach((z) => drawZone(z, "#ef4444"));
    annotations.demandZones?.forEach((z) => drawZone(z, "#22c55e"));
    annotations.fvgs?.forEach((z) => drawZone(z, "#a855f7"));
    annotations.orderBlocks?.forEach((z) => drawZone(z, "#f59e0b"));

    const drawLine = (l: Line, color: string) => {
      const y = (l.y / 100) * canvas.height;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(l.label, 8, y - 8);
    };

    if (annotations.entry) drawLine(annotations.entry, "#3b82f6");
    if (annotations.stopLoss) drawLine(annotations.stopLoss, "#ef4444");
    annotations.targets?.forEach((t) => drawLine(t, "#22c55e"));

    const a = annotations.arrow;
    if (a) {
      const x1 = (a.x1 / 100) * canvas.width;
      const y1 = (a.y1 / 100) * canvas.height;
      const x2 = (a.x2 / 100) * canvas.width;
      const y2 = (a.y2 / 100) * canvas.height;
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = Math.max(3, canvas.width / 250);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(x2, y2, Math.max(6, canvas.width / 150), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    drawAnnotations();
  }, [annotations]);

  const analyzeChart = async () => {
    if (!image || loading) return;
    setLoading(true);
    setError("");
    setAnalysis("");
    setAnnotations(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء التحليل");
      } else {
        setAnalysis(data.analysis);
        setAnnotations(data.annotations);
      }
    } catch {
      setError("تعذر الاتصال بالخدمة، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#05070d", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#34d399,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#04121f" }}>FX</div>
        <div>
          <div style={{ fontWeight: 800 }}>FX Volume</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>AI Chart Analysis</div>
        </div>
      </header>

      <section style={{ textAlign: "center", padding: "40px 20px 24px" }}>
        <h1 style={{ fontSize: "clamp(26px,5vw,44px)", fontWeight: 900, margin: 0 }}>
          حلّل شارتك بذكاء <span style={{ color: "#34d399" }}>FX Volume AI</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 12 }}>
          ارفع الشارت ليتم تحليله ورسم مناطق العرض والطلب وFVG وOB والدخول والأهداف فوق الصورة.
        </p>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto 40px", padding: "0 16px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 20 }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />

          {!image && (
            <button onClick={() => fileInputRef.current?.click()} style={{ width: "100%", padding: 60, borderRadius: 18, border: "2px dashed rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.25)", color: "#fff", fontSize: 16, cursor: "pointer" }}>
              📈 اضغط لاختيار صورة الشارت
            </button>
          )}

          {image && (
            <>
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={image} alt="Chart" onLoad={drawAnnotations} style={{ width: "100%", display: "block" }} />
                <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer" }}>
                  تغيير الصورة
                </button>
                <button onClick={analyzeChart} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(90deg,#34d399,#3b82f6)", color: "#04121f", fontWeight: 800, cursor: "pointer" }}>
                  {loading ? "جارٍ التحليل…" : "حلل الشارت"}
                </button>
              </div>
            </>
          )}

          {loading && <div style={{ marginTop: 16, textAlign: "center", color: "#6ee7b7" }}>يقوم FX Volume AI بتحليل الشارت ورسم المناطق…</div>}
          {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>{error}</div>}

          {analysis && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 800, color: "#6ee7b7", marginBottom: 8 }}>نتيجة التحليل</div>
              <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{analysis}</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, padding: 20, borderRadius: 20, textAlign: "center", background: "linear-gradient(90deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12))", border: "1px solid rgba(52,211,153,0.25)" }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>FX Volume — قوة السيولة بين يديك</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 6 }}>تحليل شارت ذكي بأسلوب ICT مع رسم المناطق والمستويات فوق الشارت.</div>
        </div>
      </section>

      <footer style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 12, paddingBottom: 30 }}>
        FX Volume AI — التحليل تعليمي وليس توصية مالية.
      </footer>
    </main>
  );
}
