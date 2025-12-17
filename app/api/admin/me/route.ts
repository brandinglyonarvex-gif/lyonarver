import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { user } = await requireAdmin();
    return NextResponse.json(user);
  } catch (error) {
    // requireAdmin throws an error if not authorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}






