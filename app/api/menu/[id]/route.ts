import { NextRequest, NextResponse } from "next/server";
import { deleteMenuItem, updateMenuItem } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = [
    "category",
    "name",
    "description",
    "glassPrice",
    "bottlePrice",
    "price",
    "currency",
    "available",
    "featured",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  for (const key of ["glassPrice", "bottlePrice", "price"] as const) {
    if (key in patch) {
      const raw = patch[key];
      if (raw === null || raw === "") {
        patch[key] = null;
      } else {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json({ error: `${key} must be a non-negative number` }, { status: 400 });
        }
        patch[key] = n;
      }
    }
  }
  const updated = await updateMenuItem(id, patch);
  if (!updated) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteMenuItem(id);
  if (!ok) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
