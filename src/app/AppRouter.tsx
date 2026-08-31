import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DisplayPage } from '../pages/display/DisplayPage';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { RafflesPage } from '../pages/admin/RafflesPage';
import { RaffleControlPage } from '../pages/admin/RaffleControlPage';
import { BrandingPage } from '../pages/admin/BrandingPage';

// Hash routing keeps every deep link working on static hosts (GitHub Pages)
// without server-side rewrites.
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/display" replace />} />
        <Route path="/display/:raffleId" element={<DisplayPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/raffles" replace />} />
          <Route path="raffles" element={<RafflesPage />} />
          <Route path="raffles/:id" element={<RaffleControlPage />} />
          <Route path="branding" element={<BrandingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/display" replace />} />
      </Routes>
    </HashRouter>
  );
}
