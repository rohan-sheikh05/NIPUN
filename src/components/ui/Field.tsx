import clsx from 'clsx';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldBase =
  'w-full bg-blueprint-950 border border-blueprint-600 rounded-sm px-3 py-2 text-sm text-line-100 placeholder:text-line-700 focus:border-signal-500 focus:outline-none transition-colors';

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="label-tag block mb-1.5">
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldBase, 'resize-y min-h-[120px]', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(fieldBase, className)} {...props} />;
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
