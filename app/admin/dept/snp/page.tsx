'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '../../../../components/common/Loader';

/** Legacy route: SNP monitoring is under ICDS monitoring (same as Health dept layout). */
export default function DeptSnpRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/dept/icds-monitoring');
  }, [router]);
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader />
    </div>
  );
}
