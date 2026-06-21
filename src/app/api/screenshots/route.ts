import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "trade-screenshots";

// Simple in-memory rate limiter: max uploads per user per window
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const uploadCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = uploadCounts.get(userId);
  if (!entry || now >= entry.resetAt) {
    uploadCounts.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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
      console.error("[POST /api/screenshots] SUPABASE_SERVICE_ROLE_KEY is not set");
      return err("Screenshot uploads are not configured. Contact the administrator.");
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    if (isRateLimited(user.id)) {
      return err("Too many uploads. Please wait a minute and try again.", 429);
    }

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

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return err("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.", 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return err("File too large. Maximum size is 10 MB.", 400);
    }

    const { data: tradeRow, error: tradeErr } = await supabase
      .from("trades")
      .select("id")
      .eq("id", tradeId)
      .eq("user_id", user.id)
      .single();
    if (tradeErr || !tradeRow) {
      return err("Trade not found.", 404);
    }

    const admin = await ensureBucket();

    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `${user.id}/${tradeId}/${Date.now()}-${safeName}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(bytes), { contentType: file.type });

    if (uploadError) {
      console.error("[POST /api/screenshots] upload:", uploadError.message);
      return err("Failed to upload screenshot.");
    }

    const { error: dbError } = await supabase.from("trade_screenshots").insert({
      trade_id: tradeId,
      user_id: user.id,
      storage_path: path,
      screenshot_type: screenshotType,
    });

    if (dbError) {
      await admin.storage.from(BUCKET).remove([path]);
      console.error("[POST /api/screenshots] db:", dbError.message);
      return err("Failed to save screenshot record.");
    }

    return NextResponse.json({ path });
  } catch (e) {
    console.error("[POST /api/screenshots]", e instanceof Error ? e.message : e);
    return err("Unexpected server error");
  }
}

// DELETE /api/screenshots — delete from storage + trade_screenshots
export async function DELETE(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[DELETE /api/screenshots] SUPABASE_SERVICE_ROLE_KEY is not set");
      return err("Screenshot deletion is not configured. Contact the administrator.");
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
    if (storageError) {
      console.error("[DELETE /api/screenshots] storage:", storageError.message);
      return err("Failed to delete screenshot file.");
    }

    const { error: dbError } = await supabase
      .from("trade_screenshots")
      .delete()
      .eq("id", screenshot_id)
      .eq("user_id", user.id);
    if (dbError) {
      console.error("[DELETE /api/screenshots] db:", dbError.message);
      return err("Failed to delete screenshot record.");
    }

    return NextResponse.json({});
  } catch (e) {
    console.error("[DELETE /api/screenshots]", e instanceof Error ? e.message : e);
    return err("Unexpected server error");
  }
}
