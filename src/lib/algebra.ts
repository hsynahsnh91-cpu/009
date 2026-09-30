import type { ExplainRequest, Explanation } from "./schema";
// Deliberately narrow grammar. Never eval user input.
export function solveLinear(query: string) {
  const m = query
    .trim()
    .replace(/−/g, "-")
    .replace(/^(solve|explain)\s+/i, "")
    .replace(/\s/g, "")
    .match(
      /^([+-]?(?:\d+(?:\.\d+)?)?)x([+-]\d+(?:\.\d+)?)?=([+-]?\d+(?:\.\d+)?)\??$/i,
    );
  if (!m) return null;
  const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : Number(m[1]),
    b = Number(m[2] || 0),
    c = Number(m[3]);
  if ([a, b, c].some((n) => !Number.isFinite(n) || Math.abs(n) > 1e9))
    return null;
  const x = a === 0 ? null : (c - b) / a;
  if (x !== null && !Number.isFinite(x)) return null;
  return { a, b, c, x };
}
export function algebraExplanation(r: ExplainRequest): Explanation | null {
  const s = solveLinear(r.query);
  if (!s) return null;
  const { a, b, c, x } = s,
    ar = r.language === "ar",
    f = (n: number) => String(Number(n.toPrecision(12)));
  const topic = `${f(a)}x ${b < 0 ? "−" : "+"} ${f(Math.abs(b))} = ${f(c)}`;
  const answer =
    x === null
      ? b === c
        ? ar
          ? "كل قيم x تحقق المعادلة."
          : "Every value of x satisfies this equation."
        : ar
          ? "لا يوجد حل."
          : "There is no solution."
      : `x = ${f(x)}`;
  const sections: Explanation["sections"] = [
    {
      title: ar ? "الفكرة الأساسية" : "The core idea",
      kind: "idea",
      content: ar
        ? r.depth === 1
          ? "نبحث عن العدد المجهول x. نحذف المقدار المضاف من الطرفين ثم نقسمهما بالتساوي."
          : r.depth === 2
            ? "المعادلة مثل ميزان متعادل. إذا أجريت العملية نفسها على الطرفين يبقى التساوي صحيحاً. نستخدم العمليات العكسية لعزل المتغير x."
            : "تحافظ إضافة الكمية نفسها إلى الطرفين والقسمة على عدد غير صفري على مجموعة الحلول. نعزل المتغير باستخدام هذه التحويلات القابلة للعكس."
        : r.depth === 1
          ? "We want to find the missing number, x. Remove the extra amount on both sides, then share what remains equally."
          : r.depth === 2
            ? "An equation is like a balanced scale. Doing the same thing to both sides keeps it balanced. Inverse operations undo addition and multiplication to isolate the variable x."
            : "An equality is preserved by adding the same quantity to both sides and by dividing both sides by a nonzero scalar. Use these reversible transformations to isolate the unknown.",
    },
    {
      title: ar ? "خطوة بخطوة" : "Step by step",
      kind: "steps",
      content:
        x === null
          ? answer
          : `${topic}\n${ar ? "اطرح" : "Subtract"} (${f(b)}) ${ar ? "من الطرفين" : "from both sides"}:\n${f(a)}x = ${f(c - b)}\n${ar ? "اقسم الطرفين على" : "Divide both sides by"} ${f(a)}:\n${answer}`,
    },
  ];
  if (x !== null)
    sections.push({
      title: ar ? "التحقق" : "Verify the result",
      kind: "equation",
      content: `${f(a)} × (${f(x)}) + (${f(b)}) ≈ ${f(a * x + b)}\n${ar ? "الطرف الأيمن" : "Right-hand side"} = ${f(c)}\n${ar ? "قد تُقرّب القيم المعروضة." : "Displayed values may be rounded."}`,
    });
  if (r.depth >= 3)
    sections.push({
      title: ar ? "الصيغة العامة" : "The general relationship",
      kind: "equation",
      content: "ax + b = c  ⇒  x = (c − b) / a,  a ≠ 0",
    });
  if (r.depth >= 4)
    sections.push({
      title: ar ? "الافتراضات والحالات الحدية" : "Assumptions and edge cases",
      kind: "limitation",
      content: ar
        ? "نفترض معاملات حقيقية. إذا كان a = 0 و b = c فكل القيم حلول؛ وإلا فلا حل. عند a ≠ 0 يكون الحل وحيداً. الحسابات العشرية محدودة الدقة."
        : "Over the real numbers, nonzero a gives exactly one solution because the affine function is injective. For a = 0, b = c is an identity; otherwise the equation is inconsistent. Floating-point arithmetic has finite precision.",
    });
  if (r.depth === 5)
    sections.push({
      title: ar ? "الحساسية" : "Sensitivity",
      kind: "equation",
      content:
        "a ≠ 0: x(a,b,c) = (c − b)/a\n∂x/∂c = 1/a;  ∂x/∂b = −1/a;  ∂x/∂a = −(c − b)/a².\n" +
        (ar
          ? "يمكن لقيمة صغيرة من |a| أن تضخّم الاضطرابات المطلقة في b و c."
          : "Small |a| can amplify absolute perturbations in b and c."),
    });
  if (r.mode === "simplify")
    sections.unshift({
      title: ar ? "تشبيه: صندوق مجهول" : "Analogy: an unknown box",
      kind: "analogy",
      content: ar
        ? "تخيل x صندوقاً لا تعرف محتواه. أزل الكمية المضافة من جانبي الميزان، ثم قسّم الباقي إلى مجموعات متساوية. هذا تشبيه وليس تعريفاً رياضياً."
        : "Imagine x is a box with an unknown amount inside. Remove the added amount from both sides of a scale, then split what remains into equal groups. This is an analogy, not a mathematical definition.",
    });
  if (r.mode === "why")
    sections.unshift({
      title: ar
        ? "لماذا تحافظ العمليات على الحل؟"
        : "Why do these operations preserve the solution?",
      kind: "idea",
      content: ar
        ? "يمكن عكس الطرح بالجمع والقسمة على عدد غير صفري بالضرب. لذلك لا نضيف حلولاً ولا نحذفها. القسمة على صفر غير معرّفة."
        : "Subtraction can be undone by addition; division by a nonzero number can be undone by multiplication. Because each step is reversible, it neither adds nor removes solutions. Division by zero is undefined.",
    });
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    depth: r.depth,
    language: r.language,
    source: "calculated",
    visualize: r.visualize,
    topic,
    category: "Mathematics",
    shortAnswer: answer,
    sections,
    concepts: ar
      ? ["المساواة", "العمليات العكسية", "المتغيرات", "التحقق"]
      : ["Equality", "Inverse operations", "Variables", "Verification"],
    quiz: [
      {
        question: ar
          ? "أي عملية تحافظ على التساوي؟"
          : "Which operation preserves equality?",
        options: ar
          ? [
              "طرح العدد نفسه من الطرفين",
              "تغيير طرف واحد فقط",
              "القسمة على صفر",
            ]
          : [
              "Subtract the same number from both sides",
              "Change only one side",
              "Divide by zero",
            ],
        answer: 0,
        explanation: ar
          ? "إجراء العملية نفسها على الطرفين يحافظ على التساوي. القسمة على صفر غير معرّفة."
          : "Applying the same subtraction to both sides preserves equality. Changing one side generally does not; division by zero is undefined.",
      },
    ],
    followUps: ["3x + 9 = 21", "-2x + 4 = 10", "0x + 5 = 5"],
  };
}
