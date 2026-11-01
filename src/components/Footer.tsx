import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-6 sm:grid-cols-2 items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero grid place-items-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">Smart&nbsp; Learning Platform</span>
          <span className="text-sm text-muted-foreground ml-2">Bridging rural learning gaps.</span>
        </div>
        <p className="text-sm text-muted-foreground sm:text-right">
          © {new Date().getFullYear()}&nbsp;A community service project
        </p>
      </div>
    </footer>
  );
}
