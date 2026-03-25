import { PortfolioHome } from "@/components/portfolio/portfolio-home";
import { getPortfolioContent } from "@/lib/portfolio-store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const content = await getPortfolioContent();

  return <PortfolioHome initialContent={content} />;
}
