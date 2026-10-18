import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

const categories = [
  "supply",
  "demand",
  "fvg",
  "ob",
  "bos",
  "mss",
  "bsl",
  "ssl",
  "sweep",
  "entry",
  "stop",
  "target",
  "scenario",
  "alternative",
  "killzone",
];

const prompt = `
حلل صورة الشارت بأسلوب ICT وSmart Money Concepts.
تعامل مع التحليل كقراءة تعليمية احتمالية، وليس إشارة تداول مؤكدة.

قواعد إلزامية:
1. لا تخترع أسعاراً أو أوقاتاً أو مناطق غير واضحة.
2. لا تستنتج المنطقة الزمنية من ساعة الجهاز أو وقت رفع الصورة.
3. Killzone يحتاج وقتاً ومحوراً زمنياً ومنطقة زمنية واضحة؛ وإلا اذكر أنه غير محدد.
4. Score تقييم وصفي تقريبي، وليس احتمال نجاح ولا نتيجة اختبار تاريخي.
5. إذا كانت الصورة غير واضحة، قل ذلك واختر انتظار أو لا تداول.
6. خطط الدخول مشروطة بالتأكيد، وليست أمراً بالتنفيذ.
7. لا تضع وقفاً داخل المنطقة التي تقول إن تجاوزه يبطل السيناريو.
8. استخدم السيناريوهات فقط عندما توجد أدلة بصرية كافية.
9. لا ترسم كل نوع قسراً. أعد فقط العناصر التي يمكن تحديدها.

الإحداثيات:
- جميع x وy نسبة مئوية من الصورة الأصلية الكاملة، من 0 إلى 100.
- الأصل أعلى يسار الصورة، وy تزداد نحو الأسفل.
- plot يحدد مساحة الشموع فقط، دون عنوان الصورة أو شعارها
  أو محور الأسعار أو محور التواريخ.
- كل الرسومات تقع داخل plot.
- zone مستطيل لمنطقة سعرية.
- line قطعة مستقيمة، وليست خطاً بعرض الصورة كلها.
- arrow سهم من البداية إلى النهاية، يمثل سيناريو مشروطاً.
- band نطاق زمني رأسي للـ Killzone فقط إذا أمكن تحديده.
- BOS وMSS خطوط عند موضع الكسر بين المستوى الأصلي وشمعة الكسر.
- BSL وSSL خطوط عند القمم أو القيعان المعنية.
- sweep سهم قصير يوضح سحب السيولة في مكانه.
- السيناريو البديل منفصل عن السيناريو الأساسي.
- للدخول والوقف والأهداف ابدأ الخط قرب أحدث الشموع،
  وانته عند الحافة اليمنى لمنطقة plot.
- الأسعار المذكورة في price يجب أن تطابق المستوى المرئي،
  وإن تعذر قراءتها اكتب "غير مقروء".

الفئات:
supply, demand, fvg, ob, bos, mss, bsl, ssl, sweep,
entry, stop, target, scenario, alternative, killzone

أعد JSON بهذه الحقول:
{
  "analysis": "نص عربي كامل",
  "score": 65,
  "decision": "انتظار",
  "warnings": ["أي قيود مهمة في قراءة الصورة"],
  "plot": {"x1": 8, "y1": 12, "x2": 88, "y2": 90},
  "drawings": [
    {
      "kind": "zone",
      "category": "supply",
      "label": "منطقة عرض",
      "price": "السعر أو النطاق المقروء",
      "note": "سبب التحديد أو شرط التأكيد",
      "x1": 65,
      "y1": 25,
      "x2": 87,
      "y2": 30
    }
  ]
}

الأرقام أعلاه أمثلة لبنية البيانات وليست مواقع تستخدمها في الصورة.

التحليل النصي يجب أن يتضمن هذه الأقسام:
## Score
اذكر أنه تقييم وصفي غير معاير، وليس احتمال نجاح.
## القرار
دخول مشروط / انتظار / لا تداول، مع السبب.
## الاتجاه العام
اذكر الأصل والإطار الزمني إذا كانا مقروءين.
## هيكل السوق
BOS وMSS / CHoCH، مع التفريق بينها وعدم اختراعها.
## السيولة
BSL وSSL وسحب السيولة إن كان واضحاً.
## مناطق العرض والطلب
العرض والطلب وFVG وOrder Block إن وجدت.
## Killzone
حددها فقط عند توفر بيانات التوقيت اللازمة.
## خطة الدخول
سيناريو مشروط، دخول، وقف، هدف أول وثانٍ،
أو اذكر عدم وجود خطة واضحة.
## قواعد No Trade
شروط تجنب الصفقة أو إلغاء الفكرة.
لا تدع أنك تحققت من الأخبار الاقتصادية من الصورة.
## السيناريو البديل
الشرط الذي يبطل السيناريو الأساسي، والاحتمال البديل.
## تنبيه
تحليل تعليمي آلي قد يخطئ في قراءة الصورة والأسعار.
ليس توصية مالية ولا ضماناً للنتيجة.

لا تزيد drawings على 24 عنصراً.
أعد JSON فقط.
`;

const coordinateSchema = { type: "NUMBER" };

const responseSchema = {
  type: "OBJECT",
  properties: {
    analysis: { type: "STRING" },
    score: { type: "NUMBER" },
    decision: { type: "STRING" },
    warnings: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    plot: {
      type: "OBJECT",
      properties: {
        x1: coordinateSchema,
        y1: coordinateSchema,
        x2: coordinateSchema,
        y2: coordinateSchema,
      },
      required: ["x1", "y1", "x2", "y2"],
    },
    drawings: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          kind: {
            type: "STRING",
            enum: ["zone", "line", "arrow", "band"],
          },
          category: {
            type: "STRING",
            enum: categories,
          },
          label: { type: "STRING" },
          price: { type: "STRING" },
          note: { type: "STRING" },
          x1: coordinateSchema,
          y1: coordinateSchema,
          x2: coordinateSchema,
          y2: coordinateSchema,
        },
        required: [
          "kind",
          "category",
          "label",
          "price",
          "note",
          "x1",
          "y1",
          "x2",
          "y2",
        ],
      },
    },
  },
  required: [
    "analysis",
    "score",
    "decision",
    "warnings",
    "plot",
    "drawings",
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coordinates(value: unknown): value is Plot {
  if (!isRecord(value)) return false;

  return ["x1", "y1", "x2", "y2"].every((key) => {
    const n = value[key];
    return typeof n === "number" &&
      Number.isFinite(n) &&
      n >= 0 &&
      n <= 100;
  });
}

function text(value: unknown, max = 250): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = body?.image;

    if (typeof image !== "string") {
      return NextResponse.json(
        { error: "لم يتم إرسال صورة صحيحة." },
        { status: 400 }
      );
    }

    if (image.length > 3_000_000) {
      return NextResponse.json(
        { error: "الصورة كبيرة. استخدم صورة أقل من 2 ميغابايت." },
        { status: 413 }
      );
    }

    const match = image.match(
      /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/
    );

    if (!match) {
      return NextResponse.json(
        { error: "استخدم صورة PNG أو JPG أو WEBP." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model =
      process.env.GEMINI_MODEL || "gemini-3.8-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح Gemini غير موجود على الخادم." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(50_000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: match[1],
                    data: match[2],
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message =
        text(data?.error?.message, 1800) ||
        "تعذر تنفيذ الطلب لدى خدمة التحليل.";

      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    const parts = data?.candidates?.[0]?.content?.parts;

    const raw = Array.isArray(parts)
      ? parts
          .map((part: { text?: string }) => part.text || "")
          .join("")
      : "";

    let result: unknown;

    try {
      result = JSON.parse(
        raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
      );
    } catch {
      return NextResponse.json(
        { error: "لم يصل تحليل مكتمل بصيغة صحيحة. لم نُعد الطلب تلقائياً." },
        { status: 502 }
      );
    }

    if (
      !isRecord(result) ||
      typeof result.analysis !== "string" ||
      !coordinates(result.plot) ||
      result.plot.x2 <= result.plot.x1 ||
      result.plot.y2 <= result.plot.y1
    ) {
      return NextResponse.json(
        { error: "تعذر تحديد حدود الشارت بشكل صالح للرسم." },
        { status: 502 }
      );
    }

    const plot = result.plot;
    const drawings: Drawing[] = [];
    let rejected = 0;

    const input = Array.isArray(result.drawings)
      ? result.drawings.slice(0, 24)
      : [];

    for (const item of input) {
      if (
        !isRecord(item) ||
        !coordinates(item) ||
        !["zone", "line", "arrow", "band"].includes(String(item.kind)) ||
        !categories.includes(String(item.category))
      ) {
        rejected++;
        continue;
      }

      const inside =
        item.x1 >= plot.x1 &&
        item.x1 <= plot.x2 &&
        item.x2 >= plot.x1 &&
        item.x2 <= plot.x2 &&
        item.y1 >= plot.y1 &&
        item.y1 <= plot.y2 &&
        item.y2 >= plot.y1 &&
        item.y2 <= plot.y2;

      const area = item.kind === "zone" || item.kind === "band";

      if (
        !inside ||
        (area && (item.x2 <= item.x1 || item.y2 <= item.y1)) ||
        (!area && item.x1 === item.x2 && item.y1 === item.y2)
      ) {
        rejected++;
        continue;
      }

      drawings.push({
        kind: item.kind as Drawing["kind"],
        category: String(item.category),
        label: text(item.label, 80),
        price: text(item.price, 100),
        note: text(item.note, 400),
        x1: item.x1,
        y1: item.y1,
        x2: item.x2,
        y2: item.y2,
      });
    }

    const warnings = Array.isArray(result.warnings)
      ? result.warnings
          .filter((item): item is string => typeof item === "string")
          .slice(0, 8)
      : [];

    if (rejected) {
      warnings.push(
        `تم إخفاء ${rejected} عناصر لأن إحداثياتها غير صالحة أو خارج حدود الشارت.`
      );
    }

    return NextResponse.json({
      analysis: result.analysis,
      score:
        typeof result.score === "number" &&
        Number.isFinite(result.score)
          ? Math.round(Math.max(0, Math.min(100, result.score)))
          : null,
      decision: text(result.decision, 100),
      warnings,
      plot,
      drawings,
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";

    const timeout =
      name === "TimeoutError" || name === "AbortError";

    return NextResponse.json(
      {
        error: timeout
          ? "انتهت مهلة الطلب. لم تتم إعادة المحاولة تلقائياً لحماية الحصة."
          : "تعذر إكمال الطلب. تحقق من الاتصال ومن بيانات الصورة.",
      },
      { status: timeout ? 504 : 500 }
    );
  }
}
