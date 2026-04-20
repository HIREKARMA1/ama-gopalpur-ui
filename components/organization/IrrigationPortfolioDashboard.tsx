import type { Organization } from '../../services/api';
import {
  MinorIrrigationPortfolioWebsite,
  type MinorIrrigationPortfolioWebsiteProps,
} from './MinorIrrigationPortfolioWebsite';

export interface IrrigationPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function IrrigationPortfolioDashboard({
  org,
  profile,
  departmentName,
  images = [],
}: IrrigationPortfolioDashboardProps) {
  const mergedProfile: MinorIrrigationPortfolioWebsiteProps['profile'] = {
    ...profile,
    minor_display_name: profile.minor_display_name ?? profile.work_name ?? profile.name,
    minor_facility_type: profile.minor_facility_type ?? profile.category,
    minor_location_line:
      profile.minor_location_line ??
      [profile.block_ulb, profile.gp_ward, profile['village__locality'] ?? profile.village_locality]
        .filter((x) => x != null && String(x).trim() !== '')
        .join(', '),
    village_locality: profile.village_locality ?? profile['village__locality'],
  };

  return (
    <MinorIrrigationPortfolioWebsite
      org={org}
      profile={mergedProfile}
      departmentName={departmentName}
      images={images}
    />
  );
}

