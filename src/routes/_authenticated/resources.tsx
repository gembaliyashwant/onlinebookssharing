import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Upload, Search, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getResourceSignedUrl } from "@/lib/resources.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({ meta: [{ title: "Resource Library — Smart Learning Platform" }] }),
  component: ResourcesPage,
});

const CATEGORIES = ["School Subjects", "Competitive Exams", "English Learning", "Computer Skills"];
const UPLOADED_BY_OPTIONS = ["Student", "Faculty", "Other"];

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResourcesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = resources.filter((r) => {
    const matchQ =
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.subject ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(q.toLowerCase());
    const matchC = category === "all" || r.category === category;
    return matchQ && matchC;
  });

  const signResource = useServerFn(getResourceSignedUrl);
  const download = async (r: typeof resources[number]) => {
    try {
      const { url, fileName } = await signResource({ data: { resourceId: r.id } });
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate link");
    }
  };


  const remove = async (r: typeof resources[number]) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    await supabase.storage.from("resources").remove([r.file_url]);
    const { error } = await supabase.from("resources").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["resources"] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resource Library</h1>
          <p className="text-muted-foreground mt-1">Free notes, PDFs & study materials shared by the community.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-hero text-primary-foreground border-0 shadow-glow">
              <Upload className="w-4 h-4 mr-1" />Upload resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Upload a resource</DialogTitle></DialogHeader>
            <UploadForm
              userId={user.id}
              onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["resources"] }); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading resources…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No resources yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload notes or PDFs to help fellow students.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-5 flex flex-col hover:shadow-glow transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-hero grid place-items-center shrink-0">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-snug truncate">{r.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.file_name} {r.file_size ? `· ${formatSize(r.file_size)}` : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">{r.category}</Badge>
                {r.subject && <Badge variant="outline">{r.subject}</Badge>}
                {r.uploaded_by && <Badge variant="secondary">{r.uploaded_by}</Badge>}
              </div>
              {r.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{r.description}</p>}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={() => download(r)}>
                  <Download className="w-4 h-4 mr-1" />Download
                </Button>
                {r.user_id === user.id && (
                  <Button size="sm" variant="ghost" onClick={() => remove(r)} aria-label="Delete resource">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: CATEGORIES[0], subject: "", uploaded_by: UPLOADED_BY_OPTIONS[0] });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please choose a file");
    if (file.size > 25 * 1024 * 1024) return toast.error("Max file size 25 MB");
    setLoading(true);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("resources").upload(path, file, {
      contentType: file.type || "application/octet-stream",
    });
    if (upErr) { setLoading(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("resources").insert({
      user_id: userId,
      title: form.title,
      description: form.description || null,
      category: form.category,
      subject: form.subject || null,
      uploaded_by: form.uploaded_by,
      file_url: path,
      file_name: file.name,
      file_size: file.size,
    });
    setLoading(false);
    if (error) {
      await supabase.storage.from("resources").remove([path]);
      return toast.error(error.message);
    }
    toast.success("Resource uploaded!");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Uploaded by</Label>
          <Select value={form.uploaded_by} onValueChange={(v) => setForm({ ...form, uploaded_by: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{UPLOADED_BY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Subject (optional)</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Physics" /></div>
      </div>
      <div className="space-y-1.5"><Label>Description (optional)</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="space-y-1.5">
        <Label>File (PDF, notes — max 25 MB)</Label>
        <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </div>
      <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0">
        {loading ? "Uploading…" : "Upload resource"}
      </Button>
    </form>
  );
}
