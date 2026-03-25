import { AdminPanel } from "@/components/portfolio/admin-panel";
import { getAdminSessionState } from "@/lib/admin-auth";
import { getPortfolioContent, isPortfolioStorageConfigured } from "@/lib/portfolio-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [content, session] = await Promise.all([
    getPortfolioContent(),
    getAdminSessionState(),
  ]);

  return (
    <AdminPanel
      initialContent={content}
      initialSession={{
        ...session,
        storageConfigured: isPortfolioStorageConfigured(),
      }}
    />
  );
}
