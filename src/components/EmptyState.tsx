import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 animate-in fade-in duration-300">
      <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
        <Icon className="h-6 w-6" />
      </div>
      {title && <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>}
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
