import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md animate-skeleton bg-muted bg-[linear-gradient(90deg,transparent,--alpha(var(--color-muted-foreground)/8%),transparent)] bg-[length:200%_100%] bg-no-repeat",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
