import CreatorHeader from "@/components/CreatorHeader";
import { TemplateMarketplace } from "@/features/template-marketplace/TemplateMarketplace";

export default function TemplateMarketplacePage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-template-marketplace">
      <CreatorHeader />
      <TemplateMarketplace />
    </div>
  );
}
