import React from 'react';
import type { AppRoute } from '../types/ecosync';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#090A0B]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-base font-bold tracking-[0.14em] text-[#F5F7F8] cursor-pointer"
          >
            ECOSYNC
          </button>
          <p className="max-w-md text-sm text-[#94A3B8]">
            Integrated environmental sensing, energy metering, and intelligent appliance control hardware.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-[#94A3B8]">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="hover:text-[#F5F7F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/about')}
            className="hover:text-[#F5F7F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/technology')}
            className="hover:text-[#F5F7F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Technology
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/features')}
            className="hover:text-[#F5F7F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/demo')}
            className="hover:text-[#F5F7F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Interactive Demo
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="hover:text-[#F5F7F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Contact
          </button>
        </div>

        <p className="text-xs text-[#64748B] whitespace-nowrap">
          © 2026 ECOSYNC Systems.
        </p>
      </div>
    </footer>
  );
};
