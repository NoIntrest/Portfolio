import { NextResponse } from "next/server";

import {
  clearAdminSession,
  createAdminSession,
  getAdminSessionState,
  isAdminPasswordConfigured,
  validateAdminPassword,
} from "@/lib/admin-auth";
import { isPortfolioStorageConfigured } from "@/lib/portfolio-store";

export async function GET() {
  const session = await getAdminSessionState();

  return NextResponse.json({
    ...session,
    storageConfigured: isPortfolioStorageConfigured(),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;
  const password = payload?.password ?? "";

  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 503 },
    );
  }

  if (!validateAdminPassword(password)) {
    return NextResponse.json(
      { error: "The admin password was not accepted." },
      { status: 401 },
    );
  }

  await createAdminSession();

  return NextResponse.json({
    authenticated: true,
    configured: true,
    storageConfigured: isPortfolioStorageConfigured(),
  });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ authenticated: false });
}
