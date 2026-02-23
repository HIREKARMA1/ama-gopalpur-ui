'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

const MINISTER_IMAGE_URL = 'https://ama-gopalpur.s3.ap-south-1.amazonaws.com/Bibhuti_Bhusan_Jena.png';

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-6 w-6 flex-col justify-center gap-1">
      <span
        className={`block h-0.5 w-5 rounded-full bg-white transition-all ${open ? 'translate-y-1.5 rotate-45' : ''}`}
      />
      <span className={`block h-0.5 w-5 rounded-full bg-white transition-all ${open ? 'opacity-0' : ''}`} />
      <span
        className={`block h-0.5 w-5 rounded-full bg-white transition-all ${open ? '-translate-y-1.5 -rotate-45' : ''}`}
      />
    </span>
  );
}

export function Navbar() {
  const { language, toggleLanguage } = useLanguage();
  const isEnglish = language === 'en';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 shrink-0 overflow-hidden shadow-lg">
      {/* Top government bar */}
      <div className="flex h-8 items-center justify-between bg-neutral-800 px-3 text-[11px] text-neutral-100 sm:px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-wide">Government of Odisha</span>
          <span className="hidden text-neutral-300 sm:inline">ଓଡ଼ିଶା ସରକାର</span>
        </div>
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-600 px-2.5 py-0.5 text-[11px] font-medium text-neutral-100 hover:border-white hover:bg-neutral-700"
        >
          {isEnglish ? 'ଓଡିଆ' : 'English'}
        </button>
      </div>

      <div className="bg-[var(--color-navbar)] overflow-hidden">
        <div className="mx-auto flex h-24 max-w-[1920px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center gap-2 text-white no-underline transition-opacity hover:opacity-90 sm:gap-4"
          >
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-lg backdrop-blur-sm">
              <Image
                src="https://ama-gopalpur.s3.ap-south-1.amazonaws.com/logo-odisha.png"
                alt="Government of Odisha emblem"
                fill
                className="object-contain"
                sizes="56px"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {t('navbar.title', language)}
              </span>
              <span className="hidden truncate text-sm font-semibold text-orange-100 sm:text-base sm:block">
                {t('navbar.tagline', language)}
              </span>
            </div>
          </Link>

          {/* Desktop: minister block | Mobile: hamburger */}
          <div className="flex min-w-0 shrink items-center gap-2 sm:gap-4">
            <div className="hidden min-w-0 shrink items-center gap-2 px-2 py-1.5 md:flex md:gap-4 md:px-4 md:py-2">
              <div className="min-w-0 shrink text-right">
                <p className="truncate text-lg font-extrabold leading-tight text-white sm:text-xl">
                  {t('navbar.ministerName', language)}
                </p>
                <p className="truncate text-sm font-semibold leading-tight text-orange-100 sm:text-base">
                  {t('navbar.ministerSubtitle', language)}
                </p>
              </div>
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
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <HamburgerIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile: horizontal tab below navbar with minister image, name, designation */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 md:hidden">
            <div className="mx-auto flex min-h-[88px] max-w-[1920px] items-center gap-4 px-3 py-4 sm:px-6 sm:py-5">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md sm:h-24 sm:w-20">
                <Image
                  src={MINISTER_IMAGE_URL}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-extrabold leading-tight text-white sm:text-lg">
                  {t('navbar.ministerName', language)}
                </p>
                <p className="truncate text-sm font-semibold leading-tight text-orange-100 sm:text-base">
                  {t('navbar.ministerSubtitle', language)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
