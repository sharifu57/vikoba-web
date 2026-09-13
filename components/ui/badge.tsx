import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeProps = React.ComponentProps<"span"> & { variant?: "default" | "secondary" | "outline" | "destructive" }
function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = { default: "bg-primary text-primary-foreground", secondary: "bg-secondary text-secondary-foreground", outline: "border border-border bg-background text-foreground", destructive: "bg-destructive/10 text-destructive" }
  return <span data-slot="badge" className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />
}
export { Badge }
