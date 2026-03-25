import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-auth";
import { resetProjects } from "@/lib/portfolio-store";

export async function POST() {
  const access = await requireAdminSession();

  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  try {
    const content = await resetProjects();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to reset the projects.",
      },
      { status: 400 },
    );
  }
}
