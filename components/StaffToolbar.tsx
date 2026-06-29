'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { isStaffToolbarEnabled } from '@/lib/staff-toolbar';

const VercelToolbar = dynamic(
  () => import('@vercel/toolbar/next').then((mod) => mod.VercelToolbar),
  { ssr: false }
);

export default function StaffToolbar() {
  const isEmployee = useMemo(() => isStaffToolbarEnabled(), []);

  if (!isEmployee) return null;

  return <VercelToolbar />;
}
