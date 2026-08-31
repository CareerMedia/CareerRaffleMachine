import { useEffect } from 'react';
import { AppRouter } from './app/AppRouter';
import { initPersistedStore } from './services/storage/persistentStore';

export default function App() {
  useEffect(() => {
    initPersistedStore().catch(() => {
      // Sync status records the error for admin UI.
    });
  }, []);

  return <AppRouter />;
}
