import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <select
        className={cn(
          "input",
          error && "input-error",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";

export { Select };

