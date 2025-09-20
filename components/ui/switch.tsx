import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          className={cn(
            "sr-only",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          props.checked ? "bg-primary-600" : "bg-gray-200"
        )}>
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              props.checked ? "translate-x-6" : "translate-x-1"
            )}
          />
        </div>
        {label && (
          <span className="text-sm font-medium text-gray-700">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
