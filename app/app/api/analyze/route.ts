import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "لم يتم إرسال صورة" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "مفتاح Gemini غير موجود" }, { status: 500 });
    }

    const base64Image = image.split(",")[1];
    const mimeType = image.substring(image.indexOf(":") + 1, image.indexOf(";"));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
أنت محلل تداول ICT محترف.
حلل صورة الشارت، ثم أعد النتيجة بصيغة JSON فقط بدون أي شرح خارج JSON.

استخدم نظام إحداثيات بالنسبة المئوية من 0 إلى 100:
- x من اليسار إلى اليمين.
- y من الأعلى إلى الأسفل.
- حدد المواقع بناءً على مكان العناصر في الصورة.

أعد JSON بهذا الشكل بالضبط:
{
  "analysis": "التحليل النصي الكامل بالعربية",
  "annotations": {
    "direction": "up أو down أو neutral",
    "supplyZones": [{"x1":0,"y1":0,"x2":100,"y2":0,"label":"عرض"}],
    "demandZones": [{"x1":0,"y1":0,"x2":100,"y2":0,"label":"طلب"}],
    "fvgs": [{"x1":0,"y1":0,"x2":100,"y2":0,"label":"FVG"}],
    "orderBlocks": [{"x1":0,"y1":0,"x2":100,"y2":0,"label":"OB"}],
    "entry": {"y":0,"label":"دخول"},
    "stopLoss": {"y":0,"label":"وقف الخسارة"},
    "targets": [{"y":0,"label":"هدف 1"},{"y":0,"label":"هدف 2"}],
    "arrow": {"x1":0,"y1":0,"x2":0,"y2":0}
  }
}

في التحليل النصي بالعربية ضع:
## Score
## القرار
## الاتجاه العام
## هيكل السوق
## السيولة
## مناطق العرض والطلب
## Killzone
## خطة الدخول
## قواعد No Trade
## السيناريو البديل
## تنبيه

لا تعطِ توصية مالية مؤكدة.
أعد JSON فقط.
`,
                },
                { inlineData: { mimeType, data: base64Image } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: any = null;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = null;
    }

    if (!parsed || !parsed.analysis) {
      return NextResponse.json({
        analysis: raw || "لم يتمكن النظام من تحليل الصورة.",
        annotations: null,
      });
    }

    return NextResponse.json({
      analysis: parsed.analysis,
      annotations: parsed.annotations || null,
    });
  } catch {
    return NextResponse.json({ error: "فشل تحليل الصورة" }, { status: 500 });
  }
}
