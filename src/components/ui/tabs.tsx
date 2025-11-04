// In src/components/ui/tabs.tsx

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

// --- MODIFIED TabsList ---
// Changed 'bg-muted' to 'bg-background' to match your 'slate-950' page.
// Changed 'rounded-md' to 'rounded-xl' to match your theme's radius.
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto items-center justify-center rounded-xl bg-background p-2 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

// --- MODIFIED TabsTrigger ---
// This is where we put your gradient card styles.
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      `
      inline-flex items-center justify-center whitespace-nowrap rounded-lg 
      px-3 py-2 text-sm font-medium 
      ring-offset-background transition-all 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
      disabled:pointer-events-none disabled:opacity-50
      
      data-[state=inactive]:bg-card data-[state=inactive]:hover:bg-accent
      data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 
      data-[state=active]:text-white 
      data-[state=active]:shadow-lg data-[state=active]:shadow-purple-700/30
      `,
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }