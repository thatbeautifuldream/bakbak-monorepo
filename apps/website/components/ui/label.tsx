"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground select-none sm:text-sm/4 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-64 peer-disabled:cursor-not-allowed peer-disabled:opacity-64",
        className,
      )}
      {...props}
    />
  )
}

export { Label }
