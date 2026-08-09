"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RiCloseLine } from "@remixicon/react"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  variant = "default",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  variant?: "default" | "inset"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex max-h-full min-h-0 flex-col bg-popover not-dark:bg-clip-padding text-popover-foreground shadow-lg/5 outline-none transition-[opacity,translate] duration-200 ease-in-out before:pointer-events-none before:absolute before:inset-0 before:shadow-[0_1px_--theme(--color-black/4%)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 max-sm:before:hidden dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
          side === "right" &&
            "inset-y-0 right-0 w-[calc(100%-(--spacing(12)))] max-w-md border-s pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] data-[state=closed]:translate-x-8 data-[state=open]:translate-x-0",
          side === "left" &&
            "inset-y-0 left-0 w-[calc(100%-(--spacing(12)))] max-w-md border-e pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] data-[state=closed]:-translate-x-8 data-[state=open]:translate-x-0",
          side === "top" &&
            "inset-x-0 top-0 border-b pt-[env(safe-area-inset-top)] data-[state=closed]:-translate-y-8 data-[state=open]:translate-y-0",
          side === "bottom" &&
            "inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)] data-[state=closed]:translate-y-8 data-[state=open]:translate-y-0",
          variant === "inset" &&
            "before:hidden sm:m-4 sm:rounded-2xl sm:border sm:before:rounded-[calc(var(--radius-2xl)-1px)]",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close asChild>
            <Button
              aria-label="Close"
              variant="ghost"
              size="icon"
              className="absolute end-2 top-[calc(env(safe-area-inset-top)+--spacing(2))]"
            >
              <RiCloseLine />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-2 p-6 in-[[data-slot=sheet-content]:has([data-slot=sheet-panel])]:pb-3 max-sm:pb-4",
        className,
      )}
      {...props}
    />
  )
}

function SheetFooter({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "bare"
}) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end mt-auto",
        variant === "default" && "border-t bg-muted/72 py-4",
        variant === "bare" &&
          "in-[[data-slot=sheet-content]:has([data-slot=sheet-panel])]:pt-3 pt-4 pb-6",
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading font-semibold text-xl leading-none",
        className,
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function SheetPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-panel"
      className={cn(
        "p-6 in-[[data-slot=sheet-content]:has([data-slot=sheet-header])]:pt-1 in-[[data-slot=sheet-content]:has([data-slot=sheet-footer]:not(.border-t))]:pb-1 overflow-y-auto",
        className,
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
  SheetTrigger,
}
