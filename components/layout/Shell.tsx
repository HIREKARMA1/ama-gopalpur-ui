import { ReactNode } from 'react';

interface ShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function Shell({ sidebar, children }: ShellProps) {
  return (
    <div className="page-content">
      <aside className="w-full md:w-72 border-r border-border bg-background-muted/40">
        {sidebar}
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}

