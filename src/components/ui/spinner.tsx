import React from "react";
import { LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "default" | "lg" | "xl";

interface SpinnerProps {
  children?: React.ReactNode;
  loading?: boolean;
  fullScreen?: boolean;
  tip?: string;
  size?: SpinnerSize;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ children, loading = true, fullScreen = false, tip = "", size = "sm", className = "" }) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  if (!loading) {
    return children || null;
  }

  const spinnerContent = (
    <div className='flex flex-col items-center justify-center gap-2'>
      <LoaderIcon className={`${sizeClasses[size]} animate-spin`} />
      {tip && <p className='text-sm text-muted-foreground animate-pulse'>{tip}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className='fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>{spinnerContent}</div>;
  }

  if (!children) {
    return <div className={`flex items-center justify-center p-4 ${className}`}>{spinnerContent}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && <div className='absolute z-50 inset-0 flex items-center justify-center bg-background/80 rounded-md'>{spinnerContent}</div>}
    </div>
  );
};
