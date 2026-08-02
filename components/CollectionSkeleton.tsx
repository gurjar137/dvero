function Bone({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-[14px] ${className}`} />;
}

export function CollectionSkeleton() {
  return (
    <>
      <div className="flex justify-between items-end gap-8 mb-6 flex-wrap">
        <div>
          <Bone className="h-8 sm:h-9 md:h-10 w-56 rounded-[10px] mb-3" />
          <Bone className="h-3.5 w-40 rounded-[6px]" />
        </div>
        <Bone className="h-3.5 w-24 rounded-[6px]" />
      </div>

      <div className="flex gap-3 flex-wrap mb-9">
        {[0, 1, 2, 3, 4].map(i => (
          <Bone key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <Bone className="h-9 w-32 rounded-sm" />
        <Bone className="h-9 w-32 rounded-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {[0, 1, 2, 3].map(i => (
          <Bone key={i} className="h-[520px] w-full rounded-2xl" />
        ))}
      </div>
    </>
  );
}
