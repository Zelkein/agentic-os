'use client';

import { use, useCallback } from 'react';
import SwarmDetail from '@/components/swarms/swarm-detail';

function SwarmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise<{ id: string }> using React.use() (Next 16 pattern)
  const { id } = use(params);

  return <SwarmDetail swarmId={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SwarmDetailPage params={params} />;
}
