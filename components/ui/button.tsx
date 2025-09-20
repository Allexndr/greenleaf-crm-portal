import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "btn",
          {
            "btn-primary": variant === "primary",
            "btn-secondary": variant === "secondary",
            "btn-danger": variant === "danger",
            "btn-success": variant === "success",
            "btn-outline": variant === "outline",
          },
          {
            "btn-sm": size === "sm",
            "btn-md": size === "md",
            "btn-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

