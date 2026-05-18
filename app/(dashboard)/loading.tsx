import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid min-h-dvh grid-cols-[280px_1fr] bg-[hsl(var(--background))]">
      <div className="bg-stone-800 p-6">
        <Skeleton className="h-10 w-32 bg-stone-700" />
        <div className="mt-8 grid gap-3">
          <Skeleton className="h-10 bg-stone-700" />
          <Skeleton className="h-10 bg-stone-700" />
          <Skeleton className="h-10 bg-stone-700" />
        </div>
      </div>
      <div className="p-8">
        <Skeleton className="h-10 w-72" />
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="mt-6 h-96" />
      </div>
    </div>
  );
}
