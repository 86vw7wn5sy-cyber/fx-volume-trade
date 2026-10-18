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
                  text: `
أنت محلل تداول محترف بأسلوب ICT وSmart Money Concepts.
حلل صورة الشارت بدقة عالية.

اكتب التحليل بالعربية بشكل منظم، واستخدم العناوين التالية بالضبط:

## Score
أعطِ قوة الفرصة من 0 إلى 100.
اكتب السبب في سطر واحد.

## القرار
اكتب واحدة فقط: دخول / انتظار / لا تداول.
اشرح السبب بإيجاز.

## الاتجاه العام
حدد الاتجاه: صاعد / هابط / عرضي.
اذكر ما إذا كان السعر في تصحيح أو استمرار.

## هيكل السوق
- Break of Structure:
- Change of State:
- اتجاه الهيكل:

## السيولة
- سيولة المشترين:
- سيولة البائعين:
- المناطق التي يُحتاج كسرها:

## مناطق العرض والطلب
- منطقة العرض:
- منطقة الطلب:
- Fair Value Gap:
- Order Block:

## Killzone
حدد Killzone المحتمل بناءً على الشارت إن أمكن.
إذا لم يكن واضحاً، اكتب: غير محدد من الصورة.

## خطة الدخول
- نوع الصفقة: شراء / بيع / انتظار
- نقطة الدخول:
- وقف الخسارة:
- الهدف الأول:
- الهدف الثاني:

## قواعد No Trade
اذكر الحالات التي يجب فيها تجنب الدخول، مثل:
- تذبذب قوي.
- عدم وضوح الهيكل.
- اقتراب منطقة سيولة كبيرة.
- مسافة غير مناسبة بين الدخول ووقف الخسارة.
- عدم تأكيد الانعكاس أو الاستمرار.

## السيناريو البديل
اكتب ماذا يحدث إذا فشل السيناريو الرئيسي.

## تنبيه
هذا تحليل تعليمي وليس توصية مالية.
القرار النهائي مسؤولية المتداول.
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
