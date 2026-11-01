import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, BookOpen, MapPin, Phone, User, Bell, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { INDIA_STATES, INDIA_STATES_CITIES } from "@/lib/india-locations";

export const Route = createFileRoute("/_authenticated/books")({
  head: () => ({ meta: [{ title: "Books — Smart Learning Platform" }] }),
  component: BooksPage,
});

const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Computer", "Competitive Exam", "Other"];

function BooksPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [manageBookId, setManageBookId] = useState<string | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,user_id,title,author,subject,class_grade,description,locality,image_url,status,created_at,owner_name" as any)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: pendingCounts = {} } = useQuery({
    queryKey: ["my-books-pending"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_my_books_pending_counts");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { map[r.book_id] = Number(r.pending_count); });
      return map;
    },
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-requests", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_requests")
        .select("book_id,status")
        .eq("requester_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = books.filter((b) => {
    const matchQ = !q || b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase());
    const matchS = subject === "all" || b.subject === subject;
    const loc = (b.locality || "").toLowerCase();
    const matchState = stateFilter === "all" || loc.includes(stateFilter.toLowerCase());
    const matchCity = cityFilter === "all" || loc.includes(cityFilter.toLowerCase());
    return matchQ && matchS && matchState && matchCity;
  });

  const requestBook = async (bookId: string) => {
    const { error } = await supabase.from("book_requests").insert({ book_id: bookId, requester_id: user.id });
    if (error) {
      if (error.code === "23505") return toast.error("You've already requested this book.");
      return toast.error(error.message);
    }
    toast.success("Request sent! The owner will be notified.");
    qc.invalidateQueries({ queryKey: ["my-requests", user.id] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Book Library</h1>
          <p className="text-muted-foreground mt-1">Share or request books in your community.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-hero text-primary-foreground border-0 shadow-glow"><Plus className="w-4 h-4 mr-1" />Share a book</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Share a book</DialogTitle></DialogHeader>
            <AddBookForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["books"] }); }} userId={user.id} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by title or author…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setCityFilter("all"); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {INDIA_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter} disabled={stateFilter === "all"}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {(INDIA_STATES_CITIES[stateFilter] ?? []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading books…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No books yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to share a book with your community.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => {
            const isOwner = b.user_id === user.id;
            const myReq = myRequests.find((r: any) => r.book_id === b.id);
            const pending = pendingCounts[b.id] ?? 0;
            return (
              <div key={b.id} className="glass rounded-2xl p-5 flex flex-col hover:shadow-glow transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold leading-snug">{b.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">by {b.author}</p>
                  </div>
                  <Badge
                    variant="default"
                    className={
                      b.status === "shared"
                        ? "bg-primary text-primary-foreground capitalize"
                        : "bg-success text-success-foreground capitalize"
                    }
                  >
                    {b.status === "shared" ? "Shared" : "Available"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">{b.subject}</Badge>
                  <Badge variant="outline">{b.class_grade}</Badge>
                </div>
                {b.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{b.description}</p>}
                <div className="text-xs text-muted-foreground mt-3 space-y-1">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{b.locality}</div>
                  <BookContact bookId={b.id} isOwner={isOwner} canSee={isOwner || myReq?.status === "approved"} />
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <User className="w-3 h-3 shrink-0" />
                    {isOwner ? "You" : (b.owner_name || "Community")}
                  </span>
                  {isOwner ? (
                    <Button size="sm" variant={pending > 0 ? "default" : "outline"} onClick={() => setManageBookId(b.id)}>
                      <Bell className="w-3.5 h-3.5 mr-1" />
                      Requests{pending > 0 ? ` (${pending})` : ""}
                    </Button>
                  ) : myReq ? (
                    <Badge variant="outline" className="capitalize">{myReq.status}</Badge>
                  ) : b.status === "shared" ? (
                    <Badge variant="outline">Unavailable</Badge>
                  ) : (
                    <Button size="sm" onClick={() => requestBook(b.id)}>Request</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!manageBookId} onOpenChange={(o) => !o && setManageBookId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Book requests</DialogTitle></DialogHeader>
          {manageBookId && <ManageRequests bookId={manageBookId} onClose={() => setManageBookId(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddBookForm({ onDone, userId }: { onDone: () => void; userId: string }) {
  const [form, setForm] = useState({
    title: "", author: "", subject: "Mathematics", class_grade: "", description: "",
    state: "", city: "", area: "", contact_number: "", owner_name: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const owner_name = form.owner_name.trim();
    if (!owner_name) return toast.error("Please enter your name.");
    if (!form.state) return toast.error("Please select a state.");
    if (!form.city) return toast.error("Please select a city.");
    const area = form.area.trim();
    const locality = [area, form.city, form.state].filter(Boolean).join(", ");
    setLoading(true);
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      subject: form.subject,
      class_grade: form.class_grade,
      description: form.description,
      locality,
      contact_number: form.contact_number.trim(),
      owner_name,
      user_id: userId,
    };
    const { error } = await supabase.from("books").insert(payload as any);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Book shared!");
    onDone();
  };

  const f = (k: "title" | "author" | "class_grade" | "description" | "area" | "contact_number" | "owner_name") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const cities = form.state ? INDIA_STATES_CITIES[form.state] ?? [] : [];

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2"><Label>Title</Label><Input value={form.title} onChange={f("title")} required /></div>
        <div className="space-y-1.5"><Label>Author</Label><Input value={form.author} onChange={f("author")} required /></div>
        <div className="space-y-1.5"><Label>Class / Grade</Label><Input value={form.class_grade} onChange={f("class_grade")} placeholder="e.g. Class 10" required /></div>
        <div className="space-y-1.5 col-span-2">
          <Label>Subject</Label>
          <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Your name</Label><Input value={form.owner_name} onChange={f("owner_name")} placeholder="Shown on the listing" required /></div>
        <div className="space-y-1.5"><Label>Contact number</Label><Input value={form.contact_number} onChange={f("contact_number")} required /></div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v, city: "" })}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {INDIA_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })} disabled={!form.state}>
            <SelectTrigger><SelectValue placeholder={form.state ? "Select city" : "Select state first"} /></SelectTrigger>
            <SelectContent>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2"><Label>Area / Locality (optional)</Label><Input value={form.area} onChange={f("area")} placeholder="e.g. Banjara Hills" /></div>
        <div className="space-y-1.5 col-span-2"><Label>Description (optional)</Label><Textarea value={form.description} onChange={f("description")} rows={3} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0">
        {loading ? "Sharing…" : "Share book"}
      </Button>
    </form>
  );
}

function ManageRequests({ bookId, onClose }: { bookId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ["book-requests", bookId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_book_requests", { _book_id: bookId });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const act = async (reqId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("book_requests").update({ status }).eq("id", reqId);
    if (error) return toast.error(error.message);
    if (status === "approved") {
      const { error: bErr } = await supabase.from("books").update({ status: "shared" }).eq("id", bookId);
      if (bErr) return toast.error(bErr.message);
    }
    toast.success(`Request ${status}`);
    await refetch();
    qc.invalidateQueries({ queryKey: ["my-books-pending"] });
    qc.invalidateQueries({ queryKey: ["books"] });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (requests.length === 0) return <p className="text-sm text-muted-foreground">No requests yet.</p>;

  const hasApproved = requests.some((r: any) => r.status === "approved");

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
      {hasApproved && (
        <p className="text-xs text-muted-foreground px-1">This book has been shared. No more requests can be approved.</p>
      )}
      {requests.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{r.requester_name || "Unknown"}</p>
            
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
          </div>
          {r.status === "pending" && !hasApproved ? (
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" variant="outline" onClick={() => act(r.id, "rejected")} aria-label="Reject request">
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => act(r.id, "approved")} aria-label="Approve request">
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Badge variant="outline" className="capitalize shrink-0">{r.status === "pending" ? "closed" : r.status}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function BookContact({ bookId, isOwner, canSee }: { bookId: string; isOwner: boolean; canSee: boolean }) {
  const [contact, setContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  const reveal = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_book_contact", { _book_id: bookId });
    setLoading(false);
    setTried(true);
    if (error) return toast.error(error.message);
    setContact((data as string | null) ?? null);
  };

  if (contact) {
    return <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{contact}</div>;
  }
  return (
    <button
      type="button"
      onClick={reveal}
      disabled={loading || !canSee}
      className="flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:text-muted-foreground"
    >
      <Phone className="w-3 h-3" />
      {loading ? "Loading…" : tried ? (isOwner ? "Contact hidden" : "Visible after request is approved") : canSee ? "Show contact" : "Visible after request is approved"}
    </button>
  );
}
