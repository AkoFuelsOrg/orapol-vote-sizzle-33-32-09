
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./ui/card";

const PostSkeleton = () => {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
        <Skeleton className="h-[200px] w-full mt-4 rounded-md" />
        <div className="flex justify-between mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </Card>
  );
};

export default PostSkeleton;
