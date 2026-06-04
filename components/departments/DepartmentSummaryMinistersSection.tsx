'use client';

import type { DepartmentSummaryMinister } from '../../lib/departmentSummaryMinisters';
import { toSummaryLang } from '../../lib/departmentSummaryMinisters';
import { DepartmentSummaryMinisterCard } from './DepartmentSummaryMinisterCard';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

type Props = {
  ministers: DepartmentSummaryMinister[];
  language?: string;
  sectionTitle?: string;
};

export function DepartmentSummaryMinistersSection({
  ministers,
  language: languageProp,
  sectionTitle,
}: Props) {
  const { language: uiLanguage } = useLanguage();
  const lang = toSummaryLang(languageProp ?? uiLanguage);
  const title = sectionTitle ?? t('dept.summary.section.ministers', uiLanguage);

  if (!ministers.length) return null;

  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {ministers.map((minister) => (
          <DepartmentSummaryMinisterCard key={minister.id} minister={minister} language={lang} />
        ))}
      </div>
    </section>
  );
}
