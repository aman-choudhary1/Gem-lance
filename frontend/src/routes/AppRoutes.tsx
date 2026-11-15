import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Route-level code splitting: the home page ships in the main bundle, everything else
// (including the Recharts-heavy admin/analytics pages) loads on demand.
const page = <K extends string>(loader: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const AuctionsPage = page(() => import('../pages/AuctionsPage'), 'AuctionsPage');
const BidsPage = page(() => import('../pages/BidsPage'), 'BidsPage');
const AuctionDetailPage = page(() => import('../pages/AuctionDetailPage'), 'AuctionDetailPage');
const EndingSoonPage = page(() => import('../pages/EndingSoonPage'), 'EndingSoonPage');
const SourcesPage = page(() => import('../pages/SourcesPage'), 'SourcesPage');
const AnalyticsReportingPage = page(() => import('../pages/AnalyticsReportingPage'), 'AnalyticsReportingPage');
const CategoriesPage = page(() => import('../pages/CategoriesPage'), 'CategoriesPage');
const LocationsPage = page(() => import('../pages/LocationsPage'), 'LocationsPage');
const SavedAuctionsPage = page(() => import('../pages/SavedAuctionsPage'), 'SavedAuctionsPage');
const AlertsPage = page(() => import('../pages/AlertsPage'), 'AlertsPage');
const NotificationsPage = page(() => import('../pages/NotificationsPage'), 'NotificationsPage');
const AdminPage = page(() => import('../pages/AdminPage'), 'AdminPage');
const LoginPage = page(() => import('../pages/LoginPage'), 'LoginPage');
const RegisterPage = page(() => import('../pages/RegisterPage'), 'RegisterPage');

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/auctions" element={<AuctionsPage />} />
          <Route path="/bids" element={<BidsPage />} />
          <Route path="/auctions/:id" element={<AuctionDetailPage />} />
          <Route path="/ending-soon" element={<EndingSoonPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/analytics" element={<AnalyticsReportingPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/saved" element={<SavedAuctionsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
