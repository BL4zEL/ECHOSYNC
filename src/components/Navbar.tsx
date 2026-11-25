import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { AppRoute } from '../types/ecosync';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const NAV_ITEMS: { route: AppRoute; label: string }[] = [
  { route: '/', label: 'Home' },
  { route: '/about', label: 'About' },
  { route: '/technology', label: 'Technology' },
  { route: '/features', label: 'Features' },
  { route: '/demo', label: 'Interactive Demo' },
  { route: '/contact', label: 'Contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 32);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (route: AppRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  const isHomeFamily =
    currentRoute === '/' ||
    currentRoute === '/about' ||
    currentRoute === '/features' ||
    currentRoute === '/contact';
  const primaryActionRoute: AppRoute =
    currentRoute === '/demo' ? '/technology' : '/demo';
  const primaryActionLabel = 'Explore ECOSYNC';

  const headerSurfaceClass = isHomeFamily
    ? scrolled || mobileOpen
      ? 'fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#111313]/92 backdrop-blur-md transition-colors duration-300'
      : 'fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-gradient-to-b from-[#111313]/75 to-transparent transition-colors duration-300'
    : 'sticky top-0 z-50 border-b border-white/[0.08] bg-[#090A0B]/95 backdrop-blur-md';

  const isNavItemActive = (itemRoute: AppRoute) => {
    if (itemRoute === '/technology') {
      return currentRoute === '/technology' || currentRoute === '/hardware';
    }
    return currentRoute === itemRoute;
  };

  return (
    <header className={`w-full ${headerSurfaceClass}`}>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-10">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="text-left text-base font-bold tracking-[0.18em] text-[#F2F4F2] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00C987]"
        >
          ECOSYNC
        </button>

        {/* Zone 2 & 3: Right-aligned navigation links + primary CTA */}
        <div className="flex items-center gap-7 shrink-0">
          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item.route);
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleNav(item.route)}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00C987] ${
                    active ? 'text-[#F2F4F2]' : 'text-[#9CA3AF] hover:text-[#F2F4F2]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#00C987]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => handleNav(primaryActionRoute)}
            className="hidden sm:inline-flex items-center justify-center rounded-sm bg-[#00C987] px-4 py-2 text-xs font-semibold tracking-wide text-[#071510] transition-colors hover:bg-[#19DBA0] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C987]"
          >
            {primaryActionLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex lg:hidden items-center justify-center rounded-sm border border-white/15 p-2 text-[#F2F4F2] hover:bg-white/5 cursor-pointer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#111313] px-6 py-4">
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item.route);
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleNav(item.route)}
                  className={`flex items-center justify-between rounded-sm px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00C987]/10 text-[#00C987]'
                      : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="text-xs font-mono text-[#00C987]">Active</span>}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleNav(primaryActionRoute)}
              className="mt-2 w-full rounded-sm bg-[#00C987] px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-[#071510] hover:bg-[#19DBA0] cursor-pointer"
            >
              {primaryActionLabel}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
