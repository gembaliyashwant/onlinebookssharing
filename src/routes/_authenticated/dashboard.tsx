import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookPlus, Library, MessageSquareText, Sparkles, BookMarked, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Smart Learning Platform" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user.id],
    queryFn: async () => {
      const [shared, requested, profile] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("book_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id),
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
      ]);
      return {
        shared: shared.count ?? 0,
        requested: requested.count ?? 0,
        name: profile.data?.name ?? user.email?.split("@")[0] ?? "Friend",
      };
    },
  });

  const cards = [
    { label: "Books shared", value: stats?.shared ?? 0, icon: BookMarked, color: "from-primary to-primary-glow" },
    { label: "Requests made", value: stats?.requested ?? 0, icon: Inbox, color: "from-secondary to-primary-glow" },
    { label: "AI Tutor", value: "24/7", icon: Sparkles, color: "from-primary to-secondary" },
  ];

  const actions = [
    { to: "/books", label: "Add or browse books", desc: "Share a book or find one nearby.", icon: BookPlus },
    { to: "/tutor", label: "Open AI Tutor", desc: "Get help with any subject instantly.", icon: MessageSquareText },
    { to: "/books", label: "Browse library", desc: "See what your community is sharing.", icon: Library },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-3xl sm:text-4xl font-bold">{stats?.name ? `${stats.name}'s Dashboard` : "Your Dashboard"} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's your learning summary.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.color} opacity-20 blur-2xl`} />
            <c.icon className="w-6 h-6 text-primary" />
            <div className="mt-4 text-3xl font-bold">{c.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {actions.map((a) => (
            <Link key={a.label} to={a.to} className="glass rounded-2xl p-6 hover:shadow-glow hover:-translate-y-1 transition-all group">
              <div className="w-11 h-11 rounded-xl gradient-hero grid place-items-center shadow-glow mb-3 group-hover:scale-110 transition-transform">
                <a.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="font-semibold">{a.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl gradient-hero p-8 sm:p-10 text-primary-foreground shadow-glow">
        <Sparkles className="w-8 h-8 mb-3 opacity-80" />
        <h3 className="text-2xl font-bold">Stuck on a problem?</h3>
        <p className="opacity-90 mt-1">Ask the AI Tutor — it knows maths, science, English and more.</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link to="/tutor">Open AI Tutor</Link>
        </Button>
      </div>
    </div>
  );
}
