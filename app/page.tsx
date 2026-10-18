"use client";

import { useState, useRef } from "react";

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 20% 10%, #0b1f3a 0%, #05070d 45%), #05070d",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  glow1: {
    position: "fixed",
    top: "-15%",
    left: "-10%",
    width: "420px",
    height: "420px",
    background: "rgba(16,185,129,0.18)",
    filter: "blur(120px)",
    borderRadius: "50%",
    zIndex: 0,
  },
  glow2: {
    position: "fixed",
    bottom: "-15%",
    right: "-10%",
    width: "420px",
    height: "420px",
    background: "rgba(59,130,246,0.18)",
    filter: "blur(120px)",
    borderRadius: "50%",
    zIndex: 0,
  },
  header: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#34d399,#3b82f6)",
    color: "#04121f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "15px",
  },
  badge: {
    fontSize: "12px",
    padding: "6px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(52,211,153,0.4)",
    color: "#6ee7b7",
  },
  hero: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    padding: "56px 20px 32px",
  },
  title: {
    fontSize: "clamp(28px, 6vw, 48px)",
    fontWeight: 900,
    lineHeight: 1.2,
    margin: 0,
  },
  gradient: {
    background: "linear-gradient(90deg,#34d399,#60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    maxWidth: "620px",
    margin: "16px auto 0",
    fontSize: "15px",
    lineHeight: 1.7,
  },
  card: {
    position: "relative",
    zIndex: 1,
    maxWidth: "760px",
    margin: "0 auto 40px",
    padding: "24px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
  },
  upload: {
    width: "100%",
    padding: "60px 20px",
    borderRadius: "18px",
    border: "2px dashed rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.25)",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  preview: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.35)",
  },
  buttons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  secondary: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#fff",
    fontSize: "15px",
    cursor: "pointer",
  },
  primary: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(90deg,#34d399,#3b82f6)",
    color: "#04121f",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
  },
  loading: {
    marginTop: "18px",
    textAlign: "center",
    color: "#6ee7b7",
    animation: "pulse 1.5s infinite",
  },
  error: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "12px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.4)",
    color: "#fca5a5",
    fontSize: "14px",
  },
  result: {
    marginTop: "26px",
  },
  resultBox: {
    marginTop: "12px",
    padding: "20px",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.1)",
    whiteSpace: "pre-wrap",
    lineHeight: 1.8,
    fontSize: "15px",
  },
  ad: {
    position: "relative",
    zIndex: 1,
    maxWidth: "760px",
    margin: "0 auto 40px",
    padding: "24px",
    borderRadius: "24px",
    textAlign: "center",
    background: "linear-gradient(90deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12))",
    border: "1px solid rgba(52,211,153,0.25)",
  },
  footer: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: "12px",
    paddingBottom: "32px",
  },
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setAnalysis("");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const analyzeChart = async () => {
    if (!image || loading) return;

    setLoading(true);
    setError("");
    setAnalysis("");

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
      }
    } catch {
      setError("تعذر الاتصال بالخدمة، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <header style={styles.header}>
        <div style={styles.logoBox}>
          <div style={styles.logo}>FX</div>
          <div>
            <div style={{ fontWeight: 800 }}>FX Volume</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              AI Chart Analysis
            </div>
          </div>
        </div>

        <span style={styles.badge}>مدعوم بالذكاء الاصطناعي</span>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.title}>
          حلّل شارتك بذكاء
          <br />
          <span style={styles.gradient}>FX Volume AI</span>
        </h1>

        <p style={styles.subtitle}>
          ارفع صورة الشارت واحصل على تحليل ICT يشمل الاتجاه، السيولة، مناطق
          العرض والطلب، نقطة الدخول، وقف الخسارة، والأهداف.
        </p>
      </section>

      <section style={styles.card}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />

        {!image && (
          <button style={styles.upload} onClick={() => fileInputRef.current?.click()}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📈</div>
            <div style={{ fontWeight: 700 }}>اضغط لاختيار صورة الشارت</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>
              PNG أو JPG — يفضل صورة واضحة للشارت
            </div>
          </button>
        )}

        {image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Chart preview" style={styles.preview} />

            <div style={styles.buttons}>
              <button
                style={styles.secondary}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                تغيير الصورة
              </button>

              <button
                style={styles.primary}
                onClick={analyzeChart}
                disabled={loading}
              >
                {loading ? "جارٍ التحليل…" : "حلل الشارت"}
              </button>
            </div>
          </>
        )}

        {loading && (
          <div style={styles.loading}>
            يقوم FX Volume AI بقراءة الشارت وتحليل السيولة والهيكل…
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {analysis && (
          <div style={styles.result}>
            <div style={{ fontWeight: 800, color: "#6ee7b7" }}>
              نتيجة التحليل
            </div>
            <div style={styles.resultBox}>{analysis}</div>
          </div>
        )}
      </section>

      <section style={styles.ad}>
        <div style={{ fontWeight: 800, fontSize: "18px" }}>
          FX Volume — قوة السيولة بين يديك
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginTop: "8px" }}>
          تحليل شارت ذكي بأسلوب ICT: السيولة، الهيكل، مناطق العرض والطلب،
          وخطة تداول واضحة.
        </div>
      </section>

      <footer style={styles.footer}>
        FX Volume AI — التحليل تعليمي وليس توصية مالية.
      </footer>
    </main>
  );
}
