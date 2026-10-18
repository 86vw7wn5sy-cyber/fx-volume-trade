"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
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
    <main className="min-h-screen bg-[#05070d] text-white">
      {/* خلفية متوهجة */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]" />
      </div>

      {/* الشعار */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center font-black text-black">
            FX
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">FX Volume</h1>
            <p className="text-xs text-white/50">AI Chart Analysis</p>
          </div>
        </div>

        <span className="hidden sm:inline-block text-xs px-3 py-1 rounded-full border border-emerald-400/40 text-emerald-300">
          مدعوم بالذكاء الاصطناعي
        </span>
      </header>

      {/* البطل */}
      <section className="text-center px-6 pt-14 pb-10">
        <h2 className="text-3xl sm:text-5xl font-black leading-tight">
          حلّل شارتك بذكاء
          <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            {" "}FX Volume AI
          </span>
        </h2>

        <p className="mt-4 text-white/60 max-w-xl mx-auto">
          ارفع صورة الشارت واحصل على تحليل ICT يشمل الاتجاه، السيولة،
          مناطق العرض والطلب، نقطة الدخول، وقف الخسارة، والأهداف.
        </p>
      </section>

      {/* أداة التحليل */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {!image && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-16 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400/60 transition bg-black/20"
            >
              <div className="text-4xl mb-3">📈</div>
              <p className="font-semibold">اضغط لاختيار صورة الشارت</p>
              <p className="text-sm text-white/50 mt-1">
                PNG أو JPG — يفضل صورة واضحة للشارت
              </p>
            </button>
          )}

          {image && (
            <div className="space-y-5">
              <div className="rounded-2xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Chart preview"
                  className="w-full max-h-[420px] object-contain bg-black/40"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl border border-white/15 hover:bg-white/5 transition disabled:opacity-40"
                >
                  تغيير الصورة
                </button>

                <button
                  onClick={analyzeChart}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-black hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "جارٍ التحليل بالذكاء الاصطناعي…" : "حلل الشارت"}
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 text-center text-emerald-300 animate-pulse">
              يقوم FX Volume AI بقراءة الشارت وتحليل السيولة والهيكل…
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
              {error}
            </div>
          )}

          {analysis && (
            <div className="mt-8">
              <h3 className="font-bold mb-3 text-emerald-300">
                نتيجة التحليل
              </h3>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                {analysis}
              </div>
            </div>
          )}
        </div>

        {/* إعلان FX Volume */}
        <div className="max-w-3xl mx-auto mt-10 rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-6 text-center">
          <h3 className="font-bold text-lg">
            FX Volume — قوة السيولة بين يديك
          </h3>
          <p className="text-white/60 text-sm mt-2">
            تحليل شارت ذكي بأسلوب ICT: السيولة، الهيكل، مناطق العرض والطلب،
            وخطة تداول واضحة.
          </p>
        </div>
      </section>

      <footer className="text-center text-xs text-white/40 pb-8">
        FX Volume AI — التحليل تعليمي وليس توصية مالية.
      </footer>
    </main>
  );
}
