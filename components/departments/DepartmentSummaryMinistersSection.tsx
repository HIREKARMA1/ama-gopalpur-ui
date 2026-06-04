'use client';

import type { DepartmentSummaryMinister } from '../../lib/departmentSummaryMinisters';
import { toSummaryLang } from '../../lib/departmentSummaryMinisters';
import { DepartmentSummaryMinisterCard } from './DepartmentSummaryMinisterCard';
import { DepartmentSummarySection } from './DepartmentSummarySection';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

type Props = {
  ministers: DepartmentSummaryMinister[];
  language?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
};

export function DepartmentSummaryMinistersSection({
  ministers,
  language: languageProp,
  sectionTitle,
  sectionSubtitle,
}: Props) {
  const { language: uiLanguage } = useLanguage();
  const lang = toSummaryLang(languageProp ?? uiLanguage);
  const title = sectionTitle ?? t('dept.summary.section.ministers', uiLanguage);
  const subtitle =
    sectionSubtitle ??
    (uiLanguage === 'or'
      ? 'ବିଭାଗ ସମ୍ବନ୍ଧୀୟ ମନ୍ତ୍ରୀମାନଙ୍କ ତଥ୍ୟ'
      : 'Leadership associated with this department');

  if (!ministers.length) return null;

  return (
    <DepartmentSummarySection title={title} subtitle={subtitle}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {ministers.map((minister) => (
          <DepartmentSummaryMinisterCard key={minister.id} minister={minister} language={lang} />
        ))}
      </div>
    </DepartmentSummarySection>
  );
}
