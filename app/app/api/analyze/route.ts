import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "لم يتم إرسال صورة" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح Gemini غير موجود" },
        { status: 500 }
      );
    }

    const base64Image = image.split(",")[1];
    const mimeType = image.substring(
      image.indexOf(":") + 1,
      image.indexOf(";")
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
أنت مدرب تداول ICT محترف.
حلل صورة الشارت بدقة.

اكتب التحليل بالعربية بشكل منظم، وركز على:
- الاتجاه العام.
- مناطق العرض والطلب.
- السيولة.
- Break of Structure.
- Change of State.
- Fair Value Gap.
- Order Block.
- Killzone المحتمل.
- نقطة دخول محتملة.
- وقف الخسارة.
- هدف أول وهدف ثاني.
- هل يجب الدخول أم الانتظار؟

لا تعطِ توصية مالية مؤكدة.
اذكر أن القرار النهائي مسؤولية المتداول.
`,
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const analysis =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "لم يتمكن النظام من تحليل الصورة.";

    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json(
      { error: "فشل تحليل الصورة" },
      { status: 500 }
    );
  }
}
