"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { RiCheckLine, RiSubtractLine } from "@remixicon/react"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "relative inline-flex size-4.5 shrink-0 items-center justify-center rounded-[.25rem] border border-input bg-background not-dark:bg-clip-padding shadow-xs/5 outline-none ring-ring transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[3px] not-data-[state=checked]:not-aria-invalid:not-disabled:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/48 disabled:cursor-not-allowed disabled:opacity-64 sm:size-4 dark:not-data-[state=checked]:bg-input/32 dark:aria-invalid:ring-destructive/24 dark:not-disabled:not-data-[state=checked]:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)] [[data-state=checked],[aria-invalid],:disabled]:shadow-none",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="absolute -inset-px flex items-center justify-center rounded-[.25rem] text-primary-foreground data-[state=unchecked]:hidden data-[state=checked]:bg-primary data-[state=indeterminate]:text-foreground data-[state=indeterminate]:bg-transparent"
      >
        {props.checked === "indeterminate" ? (
          <RiSubtractLine className="size-3.5 sm:size-3" />
        ) : (
          <RiCheckLine className="size-3.5 sm:size-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
