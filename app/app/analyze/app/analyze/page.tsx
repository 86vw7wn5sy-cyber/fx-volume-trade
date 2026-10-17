"use client";

import { useState } from "react";

export default function AnalyzePage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (event: any) => {
    const file = event.target.files[0];

    if (!file) {
      setError("لم يتم اختيار صورة");
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.onerror = () => {
      setError("فشل قراءة الصورة");
    };

    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) {
      setError("اختر صورة أولاً");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ في التحليل");
      } else {
        setResult(data.analysis);
      }
    } catch (err) {
      setError("تعذر الاتصال بالخادم");
    }

    setLoading(false);
  };

  return (
    <main>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        تحليل الشارت
      </h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ marginTop: "20px", color: "white" }}
      />

      {image && (
        <img
          src={image}
          alt="Chart"
          style={{
            width: "100%",
            marginTop: "20px",
            borderRadius: "12px",
          }}
        />
      )}

      <button
        onClick={analyze}
        disabled={loading || !image}
        style={{
          marginTop: "20px",
          padding: "14px 20px",
          background: loading || !image ? "#3f3f46" : "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontWeight: "bold",
        }}
      >
        {loading ? "جاري التحليل..." : "حلل الشارت"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "#7f1d1d",
            borderRadius: "12px",
            color: "white",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "#18181b",
            borderRadius: "12px",
            border: "1px solid #27272a",
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </div>
      )}
    </main>
  );
}
