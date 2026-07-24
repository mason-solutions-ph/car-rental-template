import { cn } from "@/lib/utils"

// motion-reduce guard is a11y-only: no visual change unless the OS preference
// is set. Shared with marketing, which is the one file this admin pass touches
// outside the admin fence.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
