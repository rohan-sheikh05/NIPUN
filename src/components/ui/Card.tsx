import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, cropmark = true, ...props }: HTMLAttributes<HTMLDivElement> & { cropmark?: boolean }) {
  return (
    <div
      className={clsx(
        'bg-blueprint-900 border border-blueprint-700 rounded-sm p-5',
        cropmark && 'cropmark',
        className
      )}
      {...props}
    />
  );
}

/**
 * The signature element: a strip of monospace meta fields, styled after the
 * title block printed in the corner of a technical drawing sheet (title,
 * scale, revision, drawn-by). Used to carry real identifying data — a job's
 * ID and posted date, a file's revision number — never decoration.
 */
export function TitleBlockMeta({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-blueprint-700 pt-3 mt-3">
      {fields.map((f) => (
        <div key={f.label} className="flex items-baseline gap-1.5">
          <span className="label-tag">{f.label}</span>
          <span className="font-mono text-xs text-line-300">{f.value}</span>
        </div>
      ))}
    </div>
  );
}
