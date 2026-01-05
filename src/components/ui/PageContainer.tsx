import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 animate-in fade-in duration-700 ${className}`}>
      {children}
    </div>
  );
}