import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, useEffect, type ComponentType } from "react";
import { Send, Sparkles, Loader2, ImageIcon, X, Copy, Trash2, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { askTutor } from "@/lib/ai-tutor.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — Smart Learning Platform" }] }),
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string; imageUrl?: string };

type MarkdownBundle = {
  ReactMarkdown: ComponentType<any>;
  remarkPlugins: unknown[];
  rehypePlugins: unknown[];
};

let markdownBundlePromise: Promise<MarkdownBundle> | null = null;

function loadMarkdownBundle() {
  markdownBundlePromise ??= Promise.all([
    import("react-markdown"),
    import("remark-math"),
    import("remark-gfm"),
    import("rehype-katex"),
  ]).then(([markdown, math, gfm, katex]) => ({
    ReactMarkdown: markdown.default as ComponentType<any>,
    remarkPlugins: [math.default, gfm.default],
    rehypePlugins: [katex.default],
  }));
  return markdownBundlePromise;
}

const LANGUAGES = [
  "English","Hindi","Tamil","Telugu","Bengali","Marathi","Gujarati",
  "Kannada","Malayalam","Punjabi","Urdu","Spanish","French","Arabic",
];
const SUBJECTS = ["General","Mathematics","Science","English","Computer Skills","General Knowledge"];
const LEVELS = ["Beginner","Intermediate","Advanced"];

const SUGGESTIONS = [
  "Explain photosynthesis simply",
  "Help me solve: 2x + 5 = 17",
  "What's the difference between 'affect' and 'effect'?",
  "Tell me about the solar system",
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function TutorPage() {
  const ask = useServerFn(askTutor);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("English");
  const [subject, setSubject] = useState("General");
  const [level, setLevel] = useState("Beginner");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Stop any speech when leaving
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch {} }, []);

  const handleImagePick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image"); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error("Image must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => toast.error("Failed to read image");
    reader.readAsDataURL(file);
  };

  const send = async (text: string) => {
    if ((!text.trim() && !pendingImage) || loading) return;
    const userMsg: Msg = {
      role: "user",
      content: text.trim() || (pendingImage ? "Please help me with this image." : ""),
      imageUrl: pendingImage ?? undefined,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingImage(null);
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next, language: language as any, subject: subject as any, level: level as any } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get response");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language === "Hindi" ? "hi-IN" : language === "Tamil" ? "ta-IN" : language === "Telugu" ? "te-IN" : language === "Bengali" ? "bn-IN" : language === "Marathi" ? "mr-IN" : language === "Spanish" ? "es-ES" : language === "French" ? "fr-FR" : language === "Arabic" ? "ar-SA" : "en-US";
    rec.onresult = (ev: any) => {
      const t = ev.results?.[0]?.[0]?.transcript ?? "";
      setInput((prev) => (prev ? prev + " " : "") + t);
    };
    rec.onerror = () => toast.error("Could not capture voice");
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const speak = (idx: number, text: string) => {
    if (!("speechSynthesis" in window)) { toast.error("Speech not supported"); return; }
    if (speakingIdx === idx) { window.speechSynthesis.cancel(); setSpeakingIdx(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[#*_`>]/g, ""));
    u.lang = language === "Hindi" ? "hi-IN" : language === "Tamil" ? "ta-IN" : language === "Spanish" ? "es-ES" : language === "French" ? "fr-FR" : language === "Arabic" ? "ar-SA" : "en-US";
    u.onend = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(u);
  };

  const copyMsg = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
    try { window.speechSynthesis?.cancel(); } catch {}
    setSpeakingIdx(null);
    toast.success("Chat cleared");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-lg">AI Tutor</h1>
          <p className="text-xs text-muted-foreground">Ask in your language · Upload images · Voice input</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} disabled={!messages.length} title="Clear chat" aria-label="Clear chat">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>{SUBJECTS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl gradient-hero mx-auto grid place-items-center shadow-glow">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">How can I help you learn today?</h2>
              <p className="text-muted-foreground mt-2">Try one of these to get started</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="glass rounded-xl p-4 text-sm text-left hover:shadow-glow transition-shadow">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              m.role === "user" ? "gradient-hero text-primary-foreground shadow-glow" : "glass"
            }`}>
              {m.imageUrl && (
                <img src={m.imageUrl} alt="attachment" className="rounded-lg mb-2 max-h-64 object-contain" />
              )}
              {m.role === "user" ? (
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
              ) : (
                <>
                  <div className="text-sm leading-relaxed tutor-md">
                    <AssistantMarkdown content={m.content} />
                  </div>
                  <div className="flex gap-1 mt-2 -mb-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyMsg(m.content)} aria-label="Copy message">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => speak(i, m.content)} aria-label={speakingIdx === i ? "Stop speaking" : "Speak message"}>
                      {speakingIdx === i ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {pendingImage && (
        <div className="mb-2 relative inline-block">
          <img src={pendingImage} alt="preview" className="h-20 rounded-lg border border-border" />
          <button
            type="button"
            onClick={() => setPendingImage(null)}
            className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow"
            aria-label="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="pt-4 border-t border-border flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { handleImagePick(e.target.files?.[0]); e.target.value = ""; }}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={loading} title="Attach image" aria-label="Attach image">
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={toggleVoice} disabled={loading} title="Voice input" aria-label={listening ? "Stop voice input" : "Start voice input"}>
          {listening ? <MicOff className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pendingImage ? "Describe what you need help with (optional)…" : "Ask your question…"}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || (!input.trim() && !pendingImage)} className="gradient-hero text-primary-foreground border-0 shadow-glow">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

function AssistantMarkdown({ content }: { content: string }) {
  const [bundle, setBundle] = useState<MarkdownBundle | null>(null);
  useEffect(() => {
    let active = true;
    loadMarkdownBundle()
      .then((loaded) => { if (active) setBundle(loaded); })
      .catch((error) => { console.error("Failed to load math renderer", error); });
    return () => { active = false; };
  }, []);
  if (!bundle) return <div className="whitespace-pre-wrap">{content}</div>;
  const { ReactMarkdown, remarkPlugins, rehypePlugins } = bundle;
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
      {content}
    </ReactMarkdown>
  );
}
