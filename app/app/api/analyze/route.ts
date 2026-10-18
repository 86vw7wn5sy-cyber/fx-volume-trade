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
        { error: "مفتاح Gemini غير موجود في Vercel" },
        { status: 500 }
      );
    }

    const base64Image = image.split(",")[1];
    const mimeType = image.substring(
      image.indexOf(":") + 1,
      image.indexOf(";")
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
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
                  text: "حلل صورة الشارت المرفقة بالعربية واذكر الاتجاه، مناطق السيولة، نقطة دخول محتملة، وقف الخسارة، والهدف.",
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

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "فشل الاتصال بـ Gemini",
        },
        { status: 500 }
      );
    }

    const analysis =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      return NextResponse.json(
        {
          error:
            data?.promptFeedback?.blockReason ||
            "لم يرجع Gemini تحليلاً. راجع المفتاح أو حاول صورة أخرى.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json(
      { error: "فشل تحليل الصورة" },
      { status: 500 }
    );
  }
}
