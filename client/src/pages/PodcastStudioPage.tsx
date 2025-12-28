import CreatorHeader from "@/components/CreatorHeader";
import { PodcastStudio } from "@/features/podcast-studio/PodcastStudio";

export default function PodcastStudioPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-podcast-studio">
      <CreatorHeader />
      <PodcastStudio />
    </div>
  );
}
