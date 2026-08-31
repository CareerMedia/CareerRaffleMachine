import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DisplayPage } from '../pages/display/DisplayPage';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { RafflesPage } from '../pages/admin/RafflesPage';
import { RaffleControlPage } from '../pages/admin/RaffleControlPage';
import { BrandingPage } from '../pages/admin/BrandingPage';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function AppRouter() {
  return (
    <BrowserRouter basename={routerBasename}>
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
    </BrowserRouter>
  );
}
