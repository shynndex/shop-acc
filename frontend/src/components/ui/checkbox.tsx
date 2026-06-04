import { Checkbox as CheckboxPrimitive } from "@base-ui/react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  ...props
}: CheckboxPrimitive.Root.Props & { checked?: boolean | "indeterminate" }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={checked === true}
      indeterminate={checked === "indeterminate"}
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-checked:bg-primary data-checked:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current [&_svg]:size-3">
        <Check />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
