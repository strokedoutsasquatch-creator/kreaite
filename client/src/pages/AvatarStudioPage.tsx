import CreatorHeader from "@/components/CreatorHeader";
import { AvatarStudio } from "@/features/ai-avatar/AvatarStudio";

export default function AvatarStudioPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-avatar-studio">
      <CreatorHeader />
      <AvatarStudio />
    </div>
  );
}
