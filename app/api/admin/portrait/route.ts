import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-auth";
import { clearPortrait, updatePortrait } from "@/lib/portfolio-store";

function getOptionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function PUT(request: Request) {
  const access = await requireAdminSession();

  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const formData = await request.formData();

  try {
    const content = await updatePortrait({
      imageUrl: `${formData.get("imageUrl") ?? ""}`,
      imageFile: getOptionalFile(formData.get("imageFile")),
    });

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update the portrait.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const access = await requireAdminSession();

  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  try {
    const content = await clearPortrait();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to remove the portrait.",
      },
      { status: 400 },
    );
  }
}
