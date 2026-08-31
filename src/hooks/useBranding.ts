import { useCallback, useEffect, useState } from 'react';
import type { BrandingSettings } from '../types/branding';
import { DEFAULT_BRANDING } from '../types/branding';
import { getRaffleService } from '../services';
import { subscribeToStorageUpdates } from '../services/storage/persistentStore';

export function useBranding(): BrandingSettings {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  const refresh = useCallback(async () => {
    const next = await getRaffleService().getBranding();
    setBranding(next);
  }, []);

  useEffect(() => {
    refresh();
    return subscribeToStorageUpdates(() => {
      refresh();
    });
  }, [refresh]);

  return branding;
}
