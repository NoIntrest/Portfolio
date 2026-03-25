import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-auth";
import { createProject } from "@/lib/portfolio-store";

function getOptionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function POST(request: Request) {
  const access = await requireAdminSession();

  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  const formData = await request.formData();

  try {
    const result = await createProject({
      url: `${formData.get("url") ?? ""}`,
      description: `${formData.get("description") ?? ""}`,
      imageUrl: `${formData.get("imageUrl") ?? ""}`,
      imageFile: getOptionalFile(formData.get("imageFile")),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save the project entry.",
      },
      { status: 400 },
    );
  }
}
