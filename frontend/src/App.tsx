import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import { LazyMotion, MotionConfig } from 'framer-motion';

// Animation engine is fetched on demand so it stays out of the entry chunk.
const loadMotionFeatures = () => import('./components/motion/features').then((mod) => mod.default);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <ThemeProvider>
              <AuthProvider>
                <ToastProvider>
                  <AppRoutes />
                </ToastProvider>
              </AuthProvider>
            </ThemeProvider>
          </BrowserRouter>
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
};

export default App;
