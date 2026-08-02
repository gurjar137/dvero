export default function Loading() {
  return (
    <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-medium tracking-[0.28em] text-black uppercase">
          D'VERO
        </h1>
        <p className="font-inter text-xs sm:text-sm tracking-[0.2em] text-black/70 uppercase">
          Preparing Your Experience...
        </p>
        <div className="w-28 sm:w-36 h-[1.5px] bg-black/10 rounded-full overflow-hidden relative mt-2">
          <div className="absolute inset-y-0 bg-[#B08D57] rounded-full animate-loading-line" />
        </div>
      </div>
    </div>
  );
}
