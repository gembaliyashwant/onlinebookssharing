import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getResourceSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ resourceId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: rowErr } = await supabaseAdmin
      .from("resources")
      .select("file_url, file_name")
      .eq("id", data.resourceId)
      .maybeSingle();
    if (rowErr) throw new Error(rowErr.message);
    if (!row) throw new Error("Resource not found");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("resources")
      .createSignedUrl(row.file_url, 60 * 5, { download: row.file_name });
    if (sErr || !signed) throw new Error(sErr?.message ?? "Could not generate link");
    return { url: signed.signedUrl, fileName: row.file_name };
  });
