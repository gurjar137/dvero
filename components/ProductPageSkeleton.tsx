function Bone({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-[14px] ${className}`} />;
}

export function ProductPageSkeleton() {
  return (
    <main className="pb-24 md:pb-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        {/* Breadcrumb */}
        <div className="pt-6 flex items-center justify-between">
          <Bone className="h-3.5 w-56 rounded-[6px]" />
          <Bone className="h-3.5 w-16 rounded-[6px]" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-14 py-6 md:py-8 pb-14 md:pb-20">
          {/* Gallery */}
          <div>
            <Bone className="aspect-[3/4] w-full mb-4 rounded-md" />
            <div className="flex gap-3">
              {[0, 1, 2, 3].map(i => (
                <Bone key={i} className="w-[74px] h-[98px] flex-shrink-0 rounded-md" />
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-full">
                <Bone className="h-3 w-20 rounded-sm mb-3" />
                <Bone className="h-8 sm:h-9 md:h-10 w-3/4 rounded-[10px]" />
              </div>
              <Bone className="min-w-[44px] w-11 h-11 rounded-full ml-4 shrink-0" />
            </div>

            {/* Price */}
            <Bone className="h-6 w-28 rounded-[8px] mt-4 mb-5" />

            {/* Rating */}
            <Bone className="h-4 w-32 rounded-[6px] mb-6" />

            {/* Description */}
            <div className="space-y-2.5 mb-8 max-w-[48ch]">
              <Bone className="h-3.5 w-full rounded-[6px]" />
              <Bone className="h-3.5 w-full rounded-[6px]" />
              <Bone className="h-3.5 w-11/12 rounded-[6px]" />
              <Bone className="h-3.5 w-4/5 rounded-[6px]" />
            </div>

            {/* Size Selection */}
            <div className="mb-7">
              <div className="flex justify-between items-center mb-3">
                <Bone className="h-3 w-20 rounded-sm" />
                <Bone className="h-3 w-20 rounded-sm" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4].map(i => (
                  <Bone key={i} className="w-12 h-11 rounded-sm" />
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex justify-between items-center mb-7">
              <Bone className="h-3 w-16 rounded-sm" />
              <Bone className="w-[128px] h-11 rounded-sm" />
            </div>

            {/* Add to Bag */}
            <Bone className="w-full h-[52px] rounded-sm mb-3" />

            {/* Buy Now */}
            <Bone className="w-full h-[52px] rounded-sm" />

            {/* Accordion */}
            <div className="mt-9 border-t border-line">
              {[0, 1, 2].map(i => (
                <div key={i} className="border-b border-line py-4">
                  <Bone className="h-3.5 w-32 rounded-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="py-14 border-t border-line">
          <Bone className="h-6 w-44 rounded-[8px] mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
            {[0, 1, 2, 3].map(i => (
              <div key={i}>
                <Bone className="aspect-[3/4] w-full mb-3 rounded-md" />
                <Bone className="h-3.5 w-4/5 rounded-sm mb-2" />
                <Bone className="h-3.5 w-1/3 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
