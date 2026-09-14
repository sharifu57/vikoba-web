import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

function Checkbox({ className, checked, type: _type, ...props }: React.ComponentProps<"input">) {
  return <span className="relative inline-flex size-4 shrink-0 items-center justify-center align-middle">
    <input type="checkbox" data-slot="checkbox" checked={checked} className={cn("peer size-4 cursor-pointer appearance-none rounded border border-input bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 checked:border-primary checked:bg-primary", className)} {...props} />
    <Check aria-hidden="true" className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 peer-checked:opacity-100" />
  </span>
}
export { Checkbox }
