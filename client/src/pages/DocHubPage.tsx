import CreatorHeader from "@/components/CreatorHeader";
import { DocHub } from "@/features/doc-hub/DocHub";

export default function DocHubPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-doc-hub">
      <CreatorHeader />
      <DocHub />
    </div>
  );
}
