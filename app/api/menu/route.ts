import { NextRequest, NextResponse } from "next/server";
import { createMenuItem, getMenu } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ menu: await getMenu() });
}

function toNullableNumber(v: unknown): number | null | undefined {
  if (v === null || v === "" || v === undefined) return v === undefined ? undefined : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const { category, name, description, currency, available, featured } = body;
  const glassPrice = toNullableNumber(body.glassPrice);
  const bottlePrice = toNullableNumber(body.bottlePrice);
  const price = toNullableNumber(body.price);

  if (!category || !name) {
    return NextResponse.json({ error: "category and name are required" }, { status: 400 });
  }
  const hasWinePricing = bottlePrice !== undefined && bottlePrice !== null;
  const hasFlatPricing = price !== undefined && price !== null;
  if (!hasWinePricing && !hasFlatPricing) {
    return NextResponse.json(
      { error: "Provide either a bottle price (wine-style) or a flat price" },
      { status: 400 }
    );
  }

  const item = await createMenuItem({
    category: String(category).trim(),
    name: String(name).trim(),
    description: description ? String(description).trim() : undefined,
    glassPrice: glassPrice ?? undefined,
    bottlePrice: bottlePrice ?? undefined,
    price: price ?? undefined,
    currency: currency ? String(currency) : "AZN",
    available: available === undefined ? true : Boolean(available),
    featured: Boolean(featured),
  });

  return NextResponse.json({ item }, { status: 201 });
}
