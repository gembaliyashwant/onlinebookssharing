import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const links = authed
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/books", label: "Books" },
        { to: "/resources", label: "Resources" },
        { to: "/tutor", label: "AI Tutor" },
      ]
    : [
        { to: "/", label: "Home" },
      ];

  return (
    <header className="sticky top-0 z-50 glass">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl gradient-hero grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">
            Smart&nbsp; Learning Platform
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              activeProps={{ className: "px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {authed ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button size="sm" className="gradient-hero text-primary-foreground border-0 shadow-glow" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-1 bg-card">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-accent">
              {l.label}
            </Link>
          ))}
          {authed ? (
            <Button variant="ghost" onClick={signOut} className="justify-start"><LogOut className="w-4 h-4 mr-2" />Sign out</Button>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg gradient-hero text-primary-foreground text-center">Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
}
