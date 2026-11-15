import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { AuctionsPage } from '../pages/AuctionsPage';
import { BidsPage } from '../pages/BidsPage';
import { AuctionDetailPage } from '../pages/AuctionDetailPage';
import { EndingSoonPage } from '../pages/EndingSoonPage';
import { SourcesPage } from '../pages/SourcesPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { LocationsPage } from '../pages/LocationsPage';
import { SavedAuctionsPage } from '../pages/SavedAuctionsPage';
import { AlertsPage } from '../pages/AlertsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { AdminPage } from '../pages/AdminPage';
import { AnalyticsReportingPage } from '../pages/AnalyticsReportingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
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
  );
};
