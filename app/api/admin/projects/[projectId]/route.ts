import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-auth";
import { removeProject } from "@/lib/portfolio-store";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const access = await requireAdminSession();

  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const { projectId } = await context.params;

  try {
    const content = await removeProject(projectId);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to remove that project.",
      },
      { status: 400 },
    );
  }
}
