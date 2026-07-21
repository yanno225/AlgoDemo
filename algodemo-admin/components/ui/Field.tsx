import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  htmlFor?: string;
  /** Texte d'aide affiché sous le champ. */
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Enveloppe d'un champ : libellé, contrôle, aide. */
export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted"
      >
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>

      {children}

      {hint && <p className="text-[12px] leading-relaxed text-ink-subtle">{hint}</p>}
    </div>
  );
}

const CONTROL =
  "w-full rounded-lg bg-surface-raised px-4 text-[14px] text-ink placeholder:text-ink-subtle " +
  "ring-1 ring-line-soft transition-shadow focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-primary-medium";

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, "h-11", className)} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(CONTROL, "resize-y py-3 leading-relaxed", className)} />
  );
}
