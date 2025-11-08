'use client';

import { useLocation } from '@/lib/context/LocationContext';

const useCachedLocation = () => {
  return useLocation();
};

export default useCachedLocation;