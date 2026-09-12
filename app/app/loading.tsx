import { SystemLoader } from "@/components/system-loader";

export default function AppLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F7F2] px-6">
      <SystemLoader label="Preparing your workspace" />
    </div>
  );
}
