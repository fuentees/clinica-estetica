import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "shadow";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4",
      outline: "border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-transparent",
      shadow: "shadow-lg rounded-lg p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    };

    return (
      <div ref={ref} className={twMerge(variants[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={twMerge("text-lg font-semibold", className)}>{children}</div>
);

export const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={twMerge("mt-2 text-gray-700 dark:text-gray-300", className)}>{children}</div>
);

export const CardFooter = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={twMerge("mt-4 flex justify-end", className)}>{children}</div>
);
