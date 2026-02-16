'use client';

export function Navbar() {
  return (
    <header
      className="flex h-14 shrink-0 items-center px-4 md:px-6"
      style={{ backgroundColor: 'var(--color-navbar)' }}
    >
      <a href="/" className="flex items-center gap-2 text-white no-underline">
        <span className="font-semibold text-white">Ama Gopalpur</span>
      </a>
    </header>
  );
}
