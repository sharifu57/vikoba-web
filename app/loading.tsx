import { SystemLoader } from "@/components/system-loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F2] px-6">
      <SystemLoader label="Loading VIKOBA360" />
    </div>
  );
}
