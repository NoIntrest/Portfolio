import { NextResponse } from "next/server";

import { getPortfolioContent, isPortfolioStorageConfigured } from "@/lib/portfolio-store";

export async function GET() {
  const content = await getPortfolioContent();

  return NextResponse.json({
    content,
    storageConfigured: isPortfolioStorageConfigured(),
  });
}
