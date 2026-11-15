import React from 'react';

interface PanelProps {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  as?: 'section' | 'div';
  id?: string;
}

/** Standard content surface for inner pages (consistent with the Aurora Ink theme). */
export const Panel: React.FC<PanelProps> = ({ title, icon, action, className = '', bodyClassName = '', children, as: Tag = 'section', id }) => (
  <Tag id={id} className={`glass-card rounded-2xl ${className}`}>
    {(title || action) && (
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-200/70 dark:border-white/[0.06]">
        <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
          {icon && <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>}
          {title}
        </h2>
        {action}
      </header>
    )}
    <div className={`p-5 ${bodyClassName}`}>{children}</div>
  </Tag>
);
