import { useState, useEffect, useCallback } from 'react';
import { EcosyncProvider } from './state/ecosyncStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { InteractiveDemoPage } from './pages/InteractiveDemoPage';
import { HardwarePage } from './pages/HardwarePage';
import { DashboardPage } from './pages/DashboardPage';
import type { AppManagementRoute, AppRoute } from './types/ecosync';

const VALID_ROUTES: readonly AppRoute[] = [
  '/',
  '/about',
  '/technology',
  '/features',
  '/demo',
  '/contact',
  '/hardware',
  '/app',
  '/app/rooms',
  '/app/analytics',
  '/app/automation',
  '/app/devices',
  '/app/settings',
];

function isManagementRoute(route: AppRoute): route is AppManagementRoute {
  return route === '/app' || route.startsWith('/app/');
}

function normalizeRoute(raw: string): AppRoute | null {
  const cleaned = raw.split('?')[0].replace(/\/+$/, '') || '/';
  return VALID_ROUTES.includes(cleaned as AppRoute) ? (cleaned as AppRoute) : null;
}

function parseRouteFromLocation(): AppRoute {
  const rawHash = window.location.hash.replace(/^#/, '');
  if (rawHash) {
    const candidate = rawHash.startsWith('/') ? rawHash : `/${rawHash}`;
    const fromHash = normalizeRoute(candidate);
    if (fromHash) {
      return fromHash;
    }
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  let pathname = window.location.pathname;
  if (base && base !== '/' && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || '/';
  }
  return normalizeRoute(pathname) ?? '/';
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => parseRouteFromLocation());

  const navigate = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    const targetHash = `#${route}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    if (route !== '/about' && route !== '/features' && route !== '/contact') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      setCurrentRoute(parseRouteFromLocation());
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const isAppExperience = isManagementRoute(currentRoute);

  const homeFocusSection =
    currentRoute === '/about'
      ? 'about'
      : currentRoute === '/features'
        ? 'features'
        : currentRoute === '/contact'
          ? 'contact'
          : null;

  const isHomeRoute =
    currentRoute === '/' ||
    currentRoute === '/about' ||
    currentRoute === '/features' ||
    currentRoute === '/contact';

  return (
    <EcosyncProvider>
      {isAppExperience ? (
        <DashboardPage currentRoute={currentRoute} onNavigate={navigate} />
      ) : (
        <div className="min-h-screen flex flex-col bg-[#090A0B] text-[#F5F7F8]">
          <Navbar currentRoute={currentRoute} onNavigate={navigate} />
          <main className="flex-1">
            {isHomeRoute && (
              <HomePage onNavigate={navigate} focusSection={homeFocusSection} />
            )}
            {currentRoute === '/demo' && <InteractiveDemoPage onNavigate={navigate} />}
            {(currentRoute === '/technology' || currentRoute === '/hardware') && (
              <HardwarePage onNavigate={navigate} />
            )}
          </main>
          {currentRoute !== '/demo' && <Footer onNavigate={navigate} />}
        </div>
      )}
    </EcosyncProvider>
  );
}
