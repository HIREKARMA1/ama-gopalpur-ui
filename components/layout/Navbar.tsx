'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

const MINISTER_IMAGE_URL = 'https://ama-gopalpur.s3.ap-south-1.amazonaws.com/Bibhuti_Bhusan_Jena.png';

export function Navbar() {
  const { language, toggleLanguage } = useLanguage();
  const isEnglish = language === 'en';

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
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg backdrop-blur-sm">
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
                AMA GOPALPUR
              </span>
              <span className="hidden truncate text-sm font-semibold text-orange-100 sm:text-base sm:block">
                {t('navbar.tagline', language)}
              </span>
            </div>
          </Link>
          <div className="flex min-w-0 shrink items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 shrink items-center gap-2 px-2 py-1.5 sm:gap-4 sm:px-4 sm:py-2">
              <div className="hidden min-w-0 shrink text-right sm:block">
                <p className="truncate text-lg font-extrabold leading-tight text-white sm:text-xl">
                  Bibhuti Bhusan Jena
                </p>
                <p className="truncate text-sm font-semibold leading-tight text-orange-100 sm:text-base">
                  {t('navbar.ministerSubtitle', language)}
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
