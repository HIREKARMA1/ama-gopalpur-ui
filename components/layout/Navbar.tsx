'use client';

import Image from 'next/image';
import Link from 'next/link';

const MINISTER_IMAGE_URL = 'https://ama-gopalpur.s3.ap-south-1.amazonaws.com/Bibhuti_Bhusan_Jena.png';

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 shrink-0 overflow-hidden shadow-lg">
      <div className="bg-[var(--color-navbar)] overflow-hidden">
        <div className="mx-auto flex h-24 max-w-[1920px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center gap-2 text-white no-underline transition-opacity hover:opacity-90 sm:gap-4"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-white">AMA Gopalpur</span>
              <span className="hidden truncate text-sm text-white/80 sm:block">Constituency Dashboard</span>
            </div>
          </Link>
          <div className="flex min-w-0 shrink items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 shrink items-center gap-2 px-2 py-1.5 sm:gap-4 sm:px-4 sm:py-2">
              <div className="hidden min-w-0 shrink text-right sm:block">
                <p className="truncate text-base font-bold leading-tight text-white">Bibhuti Bhusan Jena</p>
                <p className="truncate text-sm leading-tight text-white/80">
                  Minister of Commerce, Transport, Steel & Mine, Government of Odisha
                </p>
              </div>
              {/* Rectangular minister image - contained, no overflow */}
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-sm sm:h-20 sm:w-16 md:h-24 md:w-20">
                <Image
                  src={MINISTER_IMAGE_URL}
                  alt="Bibhuti Bhusan Jena, Minister of Commerce, Transport, Steel & Mine, Government of Odisha"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 44px, (max-width: 768px) 64px, 80px"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
