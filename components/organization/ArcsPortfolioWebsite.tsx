'use client';

import { useMemo, useState } from 'react';
import { Organization } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import {
  PsGallerySection,
  PsContactSection,
  parseArray,
  type GalleryItem,
  asString,
  displayText,
  EMPTY,
} from './EducationPsSections';
import { Images, X } from 'lucide-react';

const asText = (v: unknown) => (v == null || String(v).trim() === '' ? EMPTY : String(v));

function rowHasAnyValue(row: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((k) => String(row[k] ?? '').trim() !== '');
}

function filterInchargeForDisplay(rows: Record<string, unknown>[]) {
  return rows.filter((r) => rowHasAnyValue(r, ['image', 'role', 'name', 'contact', 'email']));
}
function filterMembershipForDisplay(rows: Record<string, unknown>[]) {
  return rows.filter((r) => rowHasAnyValue(r, ['category', 'count']));
}
function filterStockCardForDisplay(rows: Record<string, unknown>[]) {
  return rows.filter((r) => rowHasAnyValue(r, ['image', 'title', 'description', 'quantity', 'price', 'stock_arrival_date']));
}
function filterLoanForDisplay(rows: Record<string, unknown>[]) {
  return rows.filter((r) => {
    const s = String(r.sanctions ?? '').trim();
    const hasSanctions = s !== '' && s !== '[]';
    return rowHasAnyValue(r, ['image', 'title', 'description']) || hasSanctions;
  });
}

type ArcsPortfolioWebsiteProps = {
  org: Organization;
  profile: Record<string, unknown>;
  images?: string[];
};

function ArcsHeroSection({
  org,
  profile,
  sliderImages,
}: {
  org: Organization;
  profile: Record<string, unknown>;
  sliderImages: string[];
}) {
  const heroSlidesFromProfile = [profile.arcs_hero_1, profile.arcs_hero_2, profile.arcs_hero_3]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  const heroSlides = (heroSlidesFromProfile.length ? heroSlidesFromProfile : sliderImages).slice(0, 3);
  const displayName = asString(profile.arcs_name) || org.name || EMPTY;
  const tagline = asString(profile.arcs_tagline) || EMPTY;

  return (
    <section className="relative overflow-hidden">
      <ImageSlider
        images={heroSlides}
        altPrefix={asString(org.name) || 'ARCS'}
        className="h-[450px] sm:h-[550px]"
        showArrows={false}
        autoAdvanceMs={4500}
        placeholderCount={3}
        hidePlaceholderText
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-slate-700/55 via-slate-500/35 to-slate-400/25" />
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl">{displayName}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-100 drop-shadow sm:text-lg">{tagline}</p>
        </div>
      </div>
    </section>
  );
}

function ArcsAboutSection({
  org,
  profile,
  sliderImages,
}: {
  org: Organization;
  profile: Record<string, unknown>;
  sliderImages: string[];
}) {
  const [isSecretaryModalOpen, setIsSecretaryModalOpen] = useState(false);
  const [isSecretaryModalClosing, setIsSecretaryModalClosing] = useState(false);
  const societyName = asString(profile.arcs_name) || org.name || EMPTY;
  const aboutText = asString(profile.arcs_about) || EMPTY;
  const secretaryMessage = asString(profile.arcs_secretary_message) || EMPTY;
  const secretaryName = asString(profile.secretary_name) || EMPTY;
  const secretaryTitle = 'Secretary';
  const aboutImage = asString(profile.arcs_about_image) || sliderImages[0] || '';
  const visionText = asString(profile.arcs_vision) || EMPTY;
  const missionText = asString(profile.arcs_mission) || EMPTY;
  const officePhone = asString(profile.office_phone) || '—';
  const officeEmail = asString(profile.office_email) || '—';
  const closeSecretaryModal = () => {
    setIsSecretaryModalClosing(true);
    window.setTimeout(() => {
      setIsSecretaryModalOpen(false);
      setIsSecretaryModalClosing(false);
    }, 180);
  };

  return (
    <section id="about" className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">About {societyName}</h2>
      <p className="mt-4 max-w-6xl text-sm leading-relaxed text-slate-600 sm:text-base">{aboutText}</p>

      <div className="mt-6 grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div>
          <div className="overflow-hidden rounded-xl">
            {aboutImage ? (
              <img src={aboutImage} alt="ARCS" className="h-[300px] w-full object-cover sm:h-[360px] md:h-[420px]" />
            ) : (
              <div className="flex h-[300px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 sm:h-[360px] md:h-[420px]">
                <div className="text-center">
                  <Images className="mx-auto h-7 w-7 text-slate-500" />
                  <p className="mt-2 text-sm font-medium text-slate-600">{EMPTY}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-2 border-l-2 border-slate-300 pl-4 text-sm sm:text-base">
            <p className="text-slate-800">
              <span className="font-semibold">Registration:</span> {asString(profile.registration_number) || '—'}
            </p>
            <p className="text-slate-800">
              <span className="font-semibold">Block/ULB:</span> {asString(profile.block_ulb) || '—'}
            </p>
            <p className="text-slate-800">
              <span className="font-semibold">Jurisdiction:</span>{' '}
              {asString(profile.jurisdiction_type_rural_urban_mixed) || '—'}
            </p>
            <p className="text-slate-800">
              <span className="font-semibold">Location:</span> {asString(profile.full_address) || org.address || '—'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Secretary&apos;s message</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">&quot;{secretaryMessage}&quot;</p>
          </div>

          <div className="flex items-start gap-4 border-b border-slate-200 pb-5">
            <button
              type="button"
              onClick={() => {
                setIsSecretaryModalClosing(false);
                setIsSecretaryModalOpen(true);
              }}
              className="h-36 w-32 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-40 sm:w-36"
              aria-label="Open secretary photo"
            >
              {asString(profile.arcs_secretary_image) ? (
                <img src={asString(profile.arcs_secretary_image)} alt={displayText(secretaryName)} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                  <Images className="h-6 w-6 text-slate-500" />
                  <span className="text-[10px] text-slate-500">{EMPTY}</span>
                </div>
              )}
            </button>
            <div>
              <p className="text-lg font-bold text-slate-900">{secretaryName}</p>
              <p className="text-sm text-slate-600">{secretaryTitle}</p>
              <p className="mt-1 text-xs text-slate-500">
                <span className="font-semibold">Contact:</span> {officePhone}
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                <span className="font-semibold">Email:</span> {officeEmail}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-l-2 border-slate-300 pl-4">
              <h4 className="text-xl font-extrabold tracking-tight text-slate-900">Vision</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">{visionText}</p>
            </div>
            <div className="border-l-2 border-slate-300 pl-4">
              <h4 className="text-xl font-extrabold tracking-tight text-slate-900">Mission</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">{missionText}</p>
            </div>
          </div>
        </div>
      </div>

      {isSecretaryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
          onClick={closeSecretaryModal}
          role="button"
          tabIndex={0}
          style={{ animation: isSecretaryModalClosing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 180ms ease-out' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') closeSecretaryModal();
          }}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
            style={{ animation: isSecretaryModalClosing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeSecretaryModal}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            {asString(profile.arcs_secretary_image) ? (
              <img src={asString(profile.arcs_secretary_image)} alt={secretaryName} className="h-[300px] w-full object-cover sm:h-[360px]" />
            ) : (
              <div className="flex h-[300px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 sm:h-[360px]">
                <div className="text-center">
                  <Images className="mx-auto h-8 w-8 text-slate-500" />
                  <p className="mt-2 text-sm font-medium text-slate-600">{EMPTY}</p>
                </div>
              </div>
            )}
            <div className="p-4">
              <p className="text-lg font-bold text-slate-900">{secretaryName}</p>
              <p className="text-sm text-slate-600">{secretaryTitle}</p>
              <p className="mt-1 text-xs text-slate-500">
                <span className="font-semibold">Contact:</span> {officePhone}
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                <span className="font-semibold">Email:</span> {officeEmail}
              </p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

const EMPTY_INCHARGE_SLOTS = 3;

function ArcsInchargeCard({ admin }: { admin: Record<string, unknown> }) {
  return (
    <article className="flex w-full max-w-[280px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:max-w-[300px]">
      <div className="aspect-[3/4] w-full shrink-0 overflow-hidden bg-slate-100">
        {asString(admin.image) ? (
          <img
            src={asString(admin.image)}
            alt={displayText(admin.name)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <Images className="mx-auto h-7 w-7 text-slate-500" />
              <p className="mt-2 text-xs font-medium text-slate-600">{EMPTY}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{displayText(admin.role)}</p>
        <p className="mt-2 text-lg font-bold text-slate-900">{displayText(admin.name)}</p>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Contact:</span> {displayText(admin.contact)}
          </p>
          <p className="break-all">
            <span className="font-semibold">Email:</span> {displayText(admin.email)}
          </p>
        </div>
      </div>
    </article>
  );
}

function ArcsInchargeSection({ cards }: { cards: Record<string, unknown>[] }) {
  const list = cards.length ? cards : Array.from({ length: EMPTY_INCHARGE_SLOTS }, () => ({} as Record<string, unknown>));
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % list.length);

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Incharge details</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous incharge">
            ‹
          </button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next incharge">
            ›
          </button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous incharge set">
            ‹
          </button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next incharge set">
            ›
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((admin, idx) => (
            <article key={`incharge-m-${idx}`} className="w-full shrink-0">
              <div className="flex justify-center px-1">
                <ArcsInchargeCard admin={admin} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`incharge-p-${pageIdx}`} className="w-full shrink-0">
              <div className="grid gap-5 md:grid-cols-3">
                  {pageCards.map((admin, idx) => (
                    <div key={`incharge-${pageIdx}-${idx}`} className="flex justify-center">
                      <ArcsInchargeCard admin={admin} />
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ArcsMembershipSection({ rows }: { rows: Record<string, unknown>[] }) {
  const list = rows.length ? rows : [{ category: '', count: '' }];
  return (
    <section className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Membership</h2>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Count</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-800">{asText(m.category)}</td>
                <td className="px-4 py-3 text-slate-800">{asText(m.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const EMPTY_STOCK_SLOTS = 3;

/** Product cards: compact image + clamped text; full copy in modal. */
const CARD_IMG_H = 'h-[152px] sm:h-[168px]';

function ArcsStockProductCard({ card, onOpen }: { card: Record<string, unknown>; onOpen: () => void }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 overflow-hidden">
        <button type="button" onClick={onOpen} className="block w-full cursor-pointer" aria-label={`Open ${displayText(card.title)}`}>
          {asString(card.image) ? (
            <img src={asString(card.image)} alt={displayText(card.title)} className={`${CARD_IMG_H} w-full object-cover`} />
          ) : (
            <div className={`flex ${CARD_IMG_H} w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200`}>
              <div className="text-center">
                <Images className="mx-auto h-6 w-6 text-slate-500" />
                <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
              </div>
            </div>
          )}
        </button>
      </div>
      <div className="flex flex-col px-3 pb-3 pt-2">
        <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900">{displayText(card.title)}</h3>
        <p className="mt-1 line-clamp-3 text-sm leading-snug text-slate-600">{displayText(card.description)}</p>
        <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Qty:</span> {asText(card.quantity)}
          </p>
          <p>
            <span className="font-semibold">Price:</span> {asText(card.price)}
          </p>
          <p>
            <span className="font-semibold">Arrival:</span> {asText(card.stock_arrival_date)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ArcsLoanProductCard({ card, onSelect }: { card: Record<string, unknown>; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm"
      aria-label={`Open ${displayText(card.title)}`}
    >
      <div className="shrink-0 overflow-hidden">
        {asString(card.image) ? (
          <img src={asString(card.image)} alt={displayText(card.title)} className={`${CARD_IMG_H} w-full object-cover`} />
        ) : (
          <div className={`flex ${CARD_IMG_H} w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200`}>
            <div className="text-center">
              <Images className="mx-auto h-6 w-6 text-slate-500" />
              <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col px-3 pb-3 pt-2">
        <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900">{displayText(card.title)}</h3>
        <p className="mt-1 line-clamp-3 text-sm leading-snug text-slate-600">{displayText(card.description)}</p>
      </div>
    </button>
  );
}

function ArcsStockCarouselSection({
  title,
  cards,
  onCardClick,
}: {
  title: string;
  cards: Record<string, unknown>[];
  onCardClick: (card: Record<string, unknown>) => void;
}) {
  const list = cards.length ? cards : Array.from({ length: EMPTY_STOCK_SLOTS }, () => ({} as Record<string, unknown>));
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % list.length);

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous">
            ‹
          </button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next">
            ›
          </button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous set">
            ‹
          </button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next set">
            ›
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((card, idx) => (
            <article key={`stock-m-${idx}`} className="w-full shrink-0 px-1">
              <ArcsStockProductCard card={card} onOpen={() => onCardClick(card)} />
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`stock-p-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 md:grid-cols-3 md:items-start">
                  {pageCards.map((card, idx) => (
                    <ArcsStockProductCard key={`${displayText(card.title)}-${pageIdx}-${idx}`} card={card} onOpen={() => onCardClick(card)} />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ArcsLoansCarouselSection({
  cards,
  onSelect,
}: {
  cards: Record<string, unknown>[];
  onSelect: (card: Record<string, unknown>) => void;
}) {
  const list = cards.length ? cards : Array.from({ length: EMPTY_STOCK_SLOTS }, () => ({} as Record<string, unknown>));
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Mini bank loans</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length)}
            className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setCurrentMobileSlide((p) => (p + 1) % list.length)}
            className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden"
            aria-label="Next"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages)}
            className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center"
            aria-label="Previous set"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages)}
            className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center"
            aria-label="Next set"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((card, idx) => (
            <article key={`loan-m-${idx}`} className="w-full shrink-0 px-1">
              <ArcsLoanProductCard card={card} onSelect={() => onSelect(card)} />
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`loan-p-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 md:grid-cols-3 md:items-start">
                  {pageCards.map((card, idx) => (
                    <ArcsLoanProductCard key={`loan-${pageIdx}-${idx}`} card={card} onSelect={() => onSelect(card)} />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StockPreviewModal({
  card,
  closing,
  onClose,
}: {
  card: Record<string, unknown>;
  closing: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
      style={{ animation: closing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 180ms ease-out' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-3xl"
        style={{ animation: closing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-slate-100 px-3 pt-3 sm:px-4 sm:pt-4">
          {asString(card.image) ? (
            <img
              src={asString(card.image)}
              alt={displayText(card.title)}
              className="mx-auto h-auto max-h-[220px] w-full max-w-md object-contain sm:max-h-[260px] sm:max-w-lg"
            />
          ) : (
            <div className="flex h-[180px] w-full items-center justify-center sm:h-[200px]">
              <p className="text-sm text-slate-500">{EMPTY}</p>
            </div>
          )}
          <button type="button" onClick={onClose} className="absolute right-4 top-4 h-8 w-8 rounded-full bg-black/65 text-sm text-white hover:bg-black/80 sm:right-5 sm:top-5" aria-label="Close">
            ×
          </button>
        </div>
        <div className="border-t border-slate-200 p-3 sm:p-4">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{displayText(card.title)}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{displayText(card.description)}</p>
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-semibold">Qty:</span> {asText(card.quantity)}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Price:</span> {asText(card.price)}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Arrival:</span> {asText(card.stock_arrival_date)}
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes psModalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </div>
  );
}

export function ArcsPortfolioWebsite({ org, profile, images = [] }: ArcsPortfolioWebsiteProps) {
  const sliderImages = useMemo(
    () => {
      const hero = [profile.arcs_hero_1, profile.arcs_hero_2, profile.arcs_hero_3].map((x) => String(x || '').trim()).filter(Boolean);
      if (hero.length) return hero;
      if (images.length) return images;
      return org.cover_image_key ? [org.cover_image_key] : [];
    },
    [profile.arcs_hero_1, profile.arcs_hero_2, profile.arcs_hero_3, images, org.cover_image_key],
  );

  const inchargeCards = filterInchargeForDisplay(parseArray<Record<string, unknown>>(profile.arcs_incharge_cards));
  const membership = filterMembershipForDisplay(parseArray<Record<string, unknown>>(profile.arcs_membership_rows));
  const fertilisers = filterStockCardForDisplay(parseArray<Record<string, unknown>>(profile.arcs_fertiliser_cards));
  const seeds = filterStockCardForDisplay(parseArray<Record<string, unknown>>(profile.arcs_seed_cards));
  const loans = filterLoanForDisplay(parseArray<Record<string, unknown>>(profile.arcs_loan_cards));

  const galleryFromProfile = parseArray<GalleryItem>(profile.arcs_photo_gallery);
  const galleryItems = galleryFromProfile.length ? galleryFromProfile : parseArray<GalleryItem>(profile.photo_gallery);

  const contactProfile = useMemo(
    () => ({
      ...profile,
      contact_address_en: asString(profile.full_address) || org.address || '',
      contact_phone: profile.office_phone,
      contact_email: profile.office_email,
      office_hours_en: asString(profile.arcs_office_hours),
    }),
    [profile, org.address],
  );

  const [stockPreview, setStockPreview] = useState<Record<string, unknown> | null>(null);
  const [isStockPreviewClosing, setIsStockPreviewClosing] = useState(false);
  const closeStockPreview = () => {
    setIsStockPreviewClosing(true);
    window.setTimeout(() => {
      setStockPreview(null);
      setIsStockPreviewClosing(false);
    }, 180);
  };

  const [loanPreview, setLoanPreview] = useState<Record<string, unknown> | null>(null);
  const [isLoanPreviewClosing, setIsLoanPreviewClosing] = useState(false);
  const closeLoanPreview = () => {
    setIsLoanPreviewClosing(true);
    window.setTimeout(() => {
      setLoanPreview(null);
      setIsLoanPreviewClosing(false);
    }, 180);
  };

  const openStockPreview = (card: Record<string, unknown>) => {
    setIsStockPreviewClosing(false);
    setStockPreview(card);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <ArcsHeroSection org={org} profile={profile} sliderImages={sliderImages} />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <ArcsAboutSection org={org} profile={profile} sliderImages={sliderImages} />
        <ArcsInchargeSection cards={inchargeCards} />
        <ArcsMembershipSection rows={membership} />
        <ArcsStockCarouselSection title="Fertiliser section" cards={fertilisers} onCardClick={openStockPreview} />
        <ArcsStockCarouselSection title="Seed section" cards={seeds} onCardClick={openStockPreview} />
        <ArcsLoansCarouselSection cards={loans} onSelect={(c) => { setIsLoanPreviewClosing(false); setLoanPreview(c); }} />
        <PsGallerySection gallery={galleryItems} />
        <PsContactSection org={org} profile={contactProfile} language="en" />
      </main>

      {stockPreview && <StockPreviewModal card={stockPreview} closing={isStockPreviewClosing} onClose={closeStockPreview} />}

      {loanPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          style={{ animation: isLoanPreviewClosing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 220ms ease-out' }}
          onClick={closeLoanPreview}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ animation: isLoanPreviewClosing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {String(loanPreview.image || '').trim() ? (
                <img src={String(loanPreview.image)} alt={asText(loanPreview.title)} className="h-[260px] w-full object-cover" />
              ) : (
                <div className="flex h-[260px] w-full items-center justify-center bg-slate-100">
                  <Images className="h-6 w-6 text-slate-500" />
                </div>
              )}
              <button type="button" onClick={closeLoanPreview} className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold text-slate-900">{asText(loanPreview.title)}</h3>
              <p className="mt-2 text-sm text-slate-700">{asText(loanPreview.description)}</p>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Farmer</th>
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Amount</th>
                      <th className="px-3 py-2 text-left font-semibold">Interest</th>
                      <th className="px-3 py-2 text-left font-semibold">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const sanctions = parseArray<Record<string, unknown>>(loanPreview.sanctions);
                      const rows = sanctions.length ? sanctions : [{} as Record<string, unknown>];
                      return rows.map((r, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2">{asText(r.farmer ?? r.farmer_name)}</td>
                          <td className="px-3 py-2">{asText(r.date ?? r.loan_date)}</td>
                          <td className="px-3 py-2">{asText(r.amount)}</td>
                          <td className="px-3 py-2">{asText(r.interest_rate)}</td>
                          <td className="px-3 py-2">{asText(r.year)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes psModalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </div>
  );
}
