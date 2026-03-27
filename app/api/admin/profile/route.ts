import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-auth";
import { updateProfile } from "@/lib/portfolio-store";

export async function PUT(request: Request) {
  const access = await requireAdminSession();

  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  try {
    const content = await updateProfile({
      fullName: `${payload?.fullName ?? ""}`,
      role: `${payload?.role ?? ""}`,
      bio: `${payload?.bio ?? ""}`,
      email: `${payload?.email ?? ""}`,
      location: `${payload?.location ?? ""}`,
    });

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update the profile details.",
      },
      { status: 400 },
    );
  }
}
