import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background" data-testid="loading-state">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard content skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main content card skeleton */}
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-6 w-24 mx-auto" />
            <Skeleton className="h-8 w-96 mx-auto" />
            <Skeleton className="h-20 w-full max-w-2xl mx-auto" />
          </div>
        </Card>
      </main>
    </div>
  );
}
