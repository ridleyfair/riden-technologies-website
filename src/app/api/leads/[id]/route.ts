import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const lead = await prisma.lead.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(lead);
  } catch (err) {
    console.error("Lead update error:", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead delete error:", err);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
