import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentProps<"textarea"> & { error?: string }
>(({ className, error, ...props }, ref) => {
    return (
        <div className="flex flex-col w-full">
            <textarea
                className={cn(
                    "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    error && "border-red-500 focus-visible:ring-red-500 ring-red-500",
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && <span className="text-red-500 text-xs mt-1 font-medium">{error}</span>}
        </div>
    )
})
Textarea.displayName = "Textarea"

export { Textarea }
