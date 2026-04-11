'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Organization } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { Images, X } from 'lucide-react';

const EMPTY = '—';
const asText = (v: unknown) => (v == null || String(v).trim() === '' ? EMPTY : String(v));
const parseArray = <T,>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

type ArcsPortfolioWebsiteProps = {
  org: Organization;
  profile: Record<string, unknown>;
  images?: string[];
};

function CardsSlider({ title, cards, render }: { title: string; cards: Record<string, unknown>[]; render: (c: Record<string, unknown>, i: number) => ReactNode }) {
  const list = cards.length ? cards : Array.from({ length: 3 }, () => ({} as Record<string, unknown>));
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length)} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous">‹</button>
          <button type="button" onClick={() => setCurrentMobileSlide((p) => (p + 1) % list.length)} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next">›</button>
          <button type="button" onClick={() => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages)} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous set">‹</button>
          <button type="button" onClick={() => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages)} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next set">›</button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((card, i) => (
            <article key={`mobile-${i}`} className="w-full shrink-0">
              {render(card, i)}
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => (
            <article key={pageIdx} className="w-full shrink-0">
              <div className="grid gap-5 md:grid-cols-3">
                {list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize).map((card, i) => render(card, i))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ArcsPortfolioWebsite({ org, profile, images = [] }: ArcsPortfolioWebsiteProps) {
  const heroImages = useMemo(
    () => [profile.arcs_hero_1, profile.arcs_hero_2, profile.arcs_hero_3].map((x) => String(x || '').trim()).filter(Boolean),
    [profile.arcs_hero_1, profile.arcs_hero_2, profile.arcs_hero_3],
  );
  const sliderImages = heroImages.length ? heroImages : (images.length ? images : (org.cover_image_key ? [org.cover_image_key] : []));
  const inchargeCards = parseArray<Record<string, unknown>>(profile.arcs_incharge_cards);
  const membership = parseArray<Record<string, unknown>>(profile.arcs_membership_rows);
  const fertilisers = parseArray<Record<string, unknown>>(profile.arcs_fertiliser_cards);
  const seeds = parseArray<Record<string, unknown>>(profile.arcs_seed_cards);
  const loans = parseArray<Record<string, unknown>>(profile.arcs_loan_cards);
  const [loanPreview, setLoanPreview] = useState<Record<string, unknown> | null>(null);
  const [isLoanPreviewClosing, setIsLoanPreviewClosing] = useState(false);
  const closeLoanPreview = () => {
    setIsLoanPreviewClosing(true);
    window.setTimeout(() => {
      setLoanPreview(null);
      setIsLoanPreviewClosing(false);
    }, 180);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ImageSlider images={sliderImages} altPrefix={org.name} className="h-[320px] sm:h-[420px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1280px] p-6 text-white">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{asText(profile.arcs_name !== undefined ? profile.arcs_name : org.name)}</h1>
          <p className="mt-1 text-sm sm:text-lg">{asText(profile.arcs_tagline)}</p>
        </div>
      </section>

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-2xl font-extrabold text-slate-900">About ARCS</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{asText(profile.arcs_about)}</p>
            {String(profile.arcs_about_image || '').trim() ? (
              <img src={String(profile.arcs_about_image)} alt="About ARCS" className="mt-4 h-[260px] w-full rounded-xl object-cover" />
            ) : null}
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Secretary</h3>
            {String(profile.arcs_secretary_image || '').trim() ? (
              <img src={String(profile.arcs_secretary_image)} alt="Secretary" className="mt-3 h-[220px] w-full rounded-xl object-cover" />
            ) : (
              <div className="mt-3 flex h-[220px] items-center justify-center rounded-xl bg-slate-100"><Images className="h-6 w-6 text-slate-500" /></div>
            )}
            <p className="mt-3 text-sm text-slate-700">{asText(profile.secretary_name)}</p>
          </article>
        </section>

        <CardsSlider
          title="Incharge Details"
          cards={inchargeCards}
          render={(card, i) => (
            <article key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {String(card.image || '').trim() ? <img src={String(card.image)} alt={asText(card.role)} className="h-[220px] w-full object-cover" /> : <div className="flex h-[220px] items-center justify-center bg-slate-100"><Images className="h-6 w-6 text-slate-500" /></div>}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{asText(card.role)}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{asText(card.name)}</p>
                <p className="mt-1 text-sm text-slate-700">Contact: {asText(card.contact)}</p>
                <p className="text-sm text-slate-700">Email: {asText(card.email)}</p>
              </div>
            </article>
          )}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-2xl font-extrabold text-slate-900">Membership</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr><th className="px-3 py-2 text-left font-semibold">Category</th><th className="px-3 py-2 text-left font-semibold">Count</th></tr>
              </thead>
              <tbody>
                {(membership.length ? membership : [{ category: '', count: '' }]).map((m, i) => (
                  <tr key={i} className="border-t border-slate-100"><td className="px-3 py-2">{asText(m.category)}</td><td className="px-3 py-2">{asText(m.count)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {[
          ['Fertiliser Section', fertilisers],
          ['Seed Section', seeds],
        ].map(([title, rows]) => (
          <CardsSlider
            key={String(title)}
            title={String(title)}
            cards={rows as Record<string, unknown>[]}
            render={(card, i) => (
              <article key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {String(card.image || '').trim() ? <img src={String(card.image)} alt={asText(card.title)} className="h-[220px] w-full object-cover" /> : <div className="flex h-[220px] items-center justify-center bg-slate-100"><Images className="h-6 w-6 text-slate-500" /></div>}
                <div className="p-4">
                  <p className="text-lg font-bold text-slate-900">{asText(card.title)}</p>
                  <p className="mt-1 text-sm text-slate-700">{asText(card.description)}</p>
                  <p className="mt-2 text-sm text-slate-700">Qty: {asText(card.quantity)}</p>
                  <p className="text-sm text-slate-700">Price: {asText(card.price)}</p>
                  <p className="text-sm text-slate-700">Arrival: {asText(card.stock_arrival_date)}</p>
                </div>
              </article>
            )}
          />
        ))}

        <CardsSlider
          title="Mini Bank Loans"
          cards={loans}
          render={(card, i) => (
            <button key={i} type="button" className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left" onClick={() => setLoanPreview(card)}>
              {String(card.image || '').trim() ? <img src={String(card.image)} alt={asText(card.title)} className="h-[220px] w-full object-cover" /> : <div className="flex h-[220px] items-center justify-center bg-slate-100"><Images className="h-6 w-6 text-slate-500" /></div>}
              <div className="p-4">
                <p className="text-lg font-bold text-slate-900">{asText(card.title)}</p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-700">{asText(card.description)}</p>
              </div>
            </button>
          )}
        />
      </main>

      {loanPreview && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 ${
            isLoanPreviewClosing ? 'animate-[psModalFadeOut_180ms_ease-in_forwards]' : 'animate-[psModalFadeIn_220ms_ease-out]'
          }`}
          onClick={closeLoanPreview}
        >
          <div
            className={`w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ${
              isLoanPreviewClosing ? 'animate-[psModalScaleOut_180ms_ease-in_forwards]' : 'animate-[psModalScaleIn_220ms_ease-out]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {String(loanPreview.image || '').trim() ? <img src={String(loanPreview.image)} alt={asText(loanPreview.title)} className="h-[260px] w-full object-cover" /> : <div className="flex h-[260px] items-center justify-center bg-slate-100"><Images className="h-6 w-6 text-slate-500" /></div>}
              <button type="button" onClick={closeLoanPreview} className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-5 w-5" /></button>
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
      <style jsx>{`
        @keyframes psModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
          from { opacity: 1; }
          to { opacity: 0; }
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

