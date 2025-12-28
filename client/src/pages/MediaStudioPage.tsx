import MediaStudio from '@/components/MediaStudio';
import { useLocation } from 'wouter';

export default function MediaStudioPage() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="h-screen w-full bg-background">
      <MediaStudio 
        onClose={() => setLocation('/')}
        onSave={(data) => {
          console.log('Project saved:', data);
        }}
        onExport={(data) => {
          console.log('Export complete:', data);
        }}
      />
    </div>
  );
}
