import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
  imageUrl: z
    .string()
    .max(8_000_000)
    .regex(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/)
    .optional(),
});

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Spanish",
  "French",
  "Arabic",
] as const;

const SUBJECTS = ["General", "Mathematics", "Science", "English", "Computer Skills", "General Knowledge"] as const;
const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  language: z.enum(LANGUAGES).default("English"),
  subject: z.enum(SUBJECTS).default("General"),
  level: z.enum(LEVELS).default("Beginner"),
});

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const systemPrompt = `You are EduBridge AI Tutor, a friendly and patient tutor for rural students (grades 1-12 and early college). Explain concepts clearly with simple language, real-life examples, and step-by-step reasoning.

Current session:
- Subject focus: ${data.subject}
- Student level: ${data.level} (adjust depth and vocabulary accordingly)
- Respond in: ${data.language}. ALWAYS write your entire reply in ${data.language}. If ${data.language} is not English, you may keep technical/scientific terms in English in parentheses when helpful.

If the student attaches an image (e.g. a textbook problem, handwritten work, or diagram), read it carefully and solve or explain what's shown.

Formatting rules (IMPORTANT): Use Markdown. For ALL mathematics, use LaTeX with KaTeX delimiters: inline math wrapped in single dollar signs like $\\sqrt{2}$ or $x^2 + y^2 = z^2$, and display math wrapped in double dollar signs on their own lines like $$\\sqrt{2} = \\frac{a}{b}$$. Never write LaTeX inside backticks or code fences. Never escape the dollar signs. Keep encouragement positive.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...data.messages.map((m) => {
        if (m.role === "user" && m.imageUrl) {
          return {
            role: "user",
            content: [
              { type: "text", text: m.content || "Please help me with this." },
              { type: "image_url", image_url: { url: m.imageUrl } },
            ],
          };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
      }),
    });

    if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error("AI request failed");
    }

    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  });
