'use client';

import Link from 'next/link';

export default function AdminLoginChooserPage() {
  return (
    <div className="page-container items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-text">Admin access</h1>
        <p className="mt-1 text-xs text-text-muted">
          Choose how you want to log in.
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <Link
            href="/admin/super/login"
            className="block w-full rounded-md border border-border bg-background px-4 py-2 text-center font-medium text-text hover:border-primary"
          >
            Super admin login
          </Link>
          <Link
            href="/admin/dept/login"
            className="block w-full rounded-md bg-primary px-4 py-2 text-center font-medium text-primary-foreground hover:opacity-90"
          >
            Department admin login
          </Link>
        </div>
      </div>
    </div>
  );
}

