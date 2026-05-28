import React from "react";

interface ToggleRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-t border-border first:border-t-0">
      <div className="flex items-start gap-3">
        {icon && <div className="rounded-md bg-accent p-2 text-primary shrink-0">{icon}</div>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
          style={{ marginTop: 2 }}
        />
      </button>
    </div>
  );
}
