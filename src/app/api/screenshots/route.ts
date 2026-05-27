import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "trade-screenshots";

function err(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

async function ensureBucket() {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Could not create bucket: ${error.message}`);
  }
  return admin;
}

// POST /api/screenshots — upload a file and insert a trade_screenshots row
export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return err("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local. Add it and restart the dev server.");
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return err("Could not parse form data", 400);
    }

    const file = formData.get("file") as File | null;
    const tradeId = formData.get("trade_id") as string | null;
    const screenshotType = formData.get("screenshot_type") as string | null;

    if (!file || !tradeId || !screenshotType) {
      return err("Missing required fields: file, trade_id, screenshot_type", 400);
    }

    const admin = await ensureBucket();

    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `${user.id}/${tradeId}/${Date.now()}-${safeName}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(bytes), { contentType: file.type });

    if (uploadError) return err(uploadError.message);

    const { error: dbError } = await supabase.from("trade_screenshots").insert({
      trade_id: tradeId,
      user_id: user.id,
      storage_path: path,
      screenshot_type: screenshotType,
    });

    if (dbError) {
      await admin.storage.from(BUCKET).remove([path]);
      return err(dbError.message);
    }

    return NextResponse.json({ path });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    console.error("[POST /api/screenshots]", message);
    return err(message);
  }
}

// DELETE /api/screenshots — delete from storage + trade_screenshots
export async function DELETE(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return err("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.");
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { storage_path, screenshot_id } = (await req.json()) as {
      storage_path: string;
      screenshot_id: string;
    };

    if (!storage_path.startsWith(`${user.id}/`)) {
      return err("Forbidden", 403);
    }

    const admin = createAdminClient();
    const { error: storageError } = await admin.storage.from(BUCKET).remove([storage_path]);
    if (storageError) return err(storageError.message);

    const { error: dbError } = await supabase
      .from("trade_screenshots")
      .delete()
      .eq("id", screenshot_id);
    if (dbError) return err(dbError.message);

    return NextResponse.json({});
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    console.error("[DELETE /api/screenshots]", message);
    return err(message);
  }
}
