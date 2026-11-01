import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Sparkles, Users, Heart, GraduationCap, ArrowRight, BookMarked, MessageSquareText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-illustration.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Learning Platform — Rural Learning & Book Sharing Platform" },
      { name: "description", content: "Share books, access free study resources, and learn with an AI tutor. Built for rural students." },
      { property: "og:title", content: "Smart Learning Platform — Rural Learning & Book Sharing" },
      { property: "og:description", content: "Bridging the educational gap for rural learners." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BookMarked, title: "Share & Request Books", desc: "Donate textbooks you no longer need, and find ones nearby." },
  { icon: MessageSquareText, title: "AI Tutor", desc: "Ask anything, anytime. Get clear explanations in seconds." },
  { icon: GraduationCap, title: "Study Resources", desc: "Free notes and materials across school and exam subjects." },
  { icon: Users, title: "Community Driven", desc: "Built by students, for students — locally connected." },
];

const steps = [
  { n: "01", t: "Create your account", d: "Sign up free as a student in under a minute." },
  { n: "02", t: "Share or request a book", d: "List books you have, or search for ones in your locality." },
  { n: "03", t: "Learn with AI Tutor", d: "Get instant help with maths, science, English and more." },
];

const testimonials = [
  { name: "Priya, Class 10", text: "I got my Science textbook from a senior nearby. The AI tutor helped me understand chemistry I was stuck on for weeks!" },
  { name: "Arjun, Class 12", text: "Sharing my old JEE books felt great. Someone in my village is using them now. The platform is super easy to use." },
  { name: "Meera, Class 8", text: "I love that I can ask questions any time. It feels like having a teacher in my pocket." },
];

function Landing() {
  const { data: sharedCount } = useQuery({
    queryKey: ["books-shared-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_books_shared_count");
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });

  const heroStats = [
    { n: sharedCount != null ? `${sharedCount}+` : "—", l: "Books shared" },
    { n: "24/7", l: "AI Tutor" },
    { n: "Free", l: "Forever" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />


      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-soft opacity-60 -z-10" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl -z-10" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span>Free for every student</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Bridging the gap to <span className="text-gradient">quality education</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Smart Learning Platform helps rural students access books, share resources within their community, and learn with an AI tutor — anytime, anywhere.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started free <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#how">How it works</a>
              </Button>
            </div>
            <div className="flex gap-8 pt-4">
              {heroStats.map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold text-gradient">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 gradient-hero rounded-3xl blur-3xl opacity-30 -z-10" />
            <img
              src={heroImg}
              alt="Rural students sharing books and learning together"
              width={1280}
              height={960}
              className="rounded-3xl shadow-elegant w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Everything a learner needs</h2>
          <p className="text-muted-foreground mt-3">One platform to share, discover, and grow.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:shadow-glow hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl gradient-hero grid place-items-center mb-4 shadow-glow">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="gradient-soft py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="text-muted-foreground mt-3">Three simple steps to start learning.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="glass rounded-2xl p-7 relative overflow-hidden">
                <div className="text-6xl font-bold text-gradient opacity-30 absolute -top-2 -right-2">{s.n}</div>
                <h3 className="font-semibold text-xl mt-6">{s.t}</h3>
                <p className="text-muted-foreground mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 sm:p-16 text-center shadow-glow">
          <BookOpen className="w-10 h-10 text-primary-foreground/80 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">Start your learning journey</h2>
          <p className="text-primary-foreground/90 mt-3 max-w-xl mx-auto">
            Join Smart Learning Platform today — share, learn, and grow with your community.
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>Create free account</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
