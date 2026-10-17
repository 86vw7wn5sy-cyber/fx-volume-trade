import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "لم يتم إرسال صورة" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
أنت مدرب تداول ICT محترف.
حلل صورة الشارت بدقة.

ركز على:
- الاتجاه العام.
- مناطق العرض والطلب.
- سيولة واضحة.
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
          role: "user",
          content: [
            {
              type: "text",
              text: "حلل هذه الصورة واكتب التحليل بالعربية بشكل منظم.",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
    });

    const analysis =
      response.choices[0]?.message?.content ||
      "لم يتمكن النظام من تحليل الصورة.";

    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json(
      { error: "فشل تحليل الصورة" },
      { status: 500 }
    );
  }
}
