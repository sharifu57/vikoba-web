type SystemLoaderProps = {
  label?: string;
};

export function SystemLoader({ label = "Loading" }: SystemLoaderProps) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-[3px] border-[#E9EFEB] border-r-[#D99A2B] border-t-[#0B6B50] motion-safe:animate-spin" />
        <div className="absolute inset-2 grid place-items-center rounded-full bg-white shadow-sm">
          <img src="/logo.png" alt="" aria-hidden="true" className="h-11 w-11 object-contain" />
        </div>
      </div>
      <p className="text-sm font-bold text-[#0B6B50]">{label}</p>
      <span className="sr-only">Please wait</span>
    </div>
  );
}
