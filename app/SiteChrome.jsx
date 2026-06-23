'use client';

// FAZ 2 — CRA src/App.js AppContent kabuk (chrome) mantığının Next App Router'a taşınmış hâli.
// Routing artık Next dosya-tabanlı; burada SADECE kabuk (Header/Sidebar/Footer/Cookie/ScrollTop)
// görünürlük mantığı + scroll override + toast navigate bridge + OnboardingGate yaşar.
// document.title YÖNETİLMEZ — Next Metadata API hallediyor (App.js'teki titleMap effect'i ATLANDI).
import React, { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { stripLocale } from '@/lib/locales';
import { Link, useNavigate, useNavigationType } from '@/compat/router';
import { BrandProvider } from '@/context/BrandContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useAuth } from '@/context/AuthContext';
import SidebarPatient from '@/components/SidebarPatient';
import CookieBanner from '@/components/CookieBanner';
import { Footer, Header } from '@/components/layout';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';
import scrollConfig from '@/config/scroll';

function OnboardingGate() {
  const { user } = useAuth();
  const pathname = stripLocale(usePathname() || '/');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const isClinicOwner = user.role_id === 'clinicOwner';
    const isDoctor = user.role === 'doctor' || user.role_id === 'doctor';
    const needsOnboarding = (isDoctor || isClinicOwner) && user.onboarding_completed === false;

    const isOnboardingPage = pathname === '/onboarding' || pathname === '/clinic/onboarding';
    const isPublicPage = ['/login', '/register', '/auth', '/doctor-login', '/clinic-login',
      '/verify-email', '/forgot-password', '/terms-of-service', '/privacy-policy',
      '/cookie-policy', '/kvkk', '/data-rights'].includes(pathname);

    if (needsOnboarding && !isOnboardingPage && !isPublicPage) {
      if (isClinicOwner) {
        navigate('/clinic/onboarding', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }

    // Reverse guard: if onboarding IS completed, never show onboarding page again
    if ((isDoctor || isClinicOwner) && user.onboarding_completed === true && isOnboardingPage) {
      const dash = isClinicOwner ? '/clinic/dashboard' : '/crm';
      navigate(dash, { replace: true });
    }
  }, [user, pathname, navigate]);

  return null;
}

export default function SiteChrome({ children, brand = 'medagama' }) {
  const pathname = stripLocale(usePathname() || '/');
  const navType = useNavigationType();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMedstream = brand === 'medstream';

  // Bridge for toast SPA navigation (ToastContext uses this)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__TOAST_NAVIGATE = navigate;
    return () => { delete window.__TOAST_NAVIGATE; };
  }, [navigate]);

  // Sidebar for all logged-in users (incl. patients), but not on CRM/admin/hospital/verify-email
  const isHospital = user?.role_id === 'hospital' || user?.role === 'hospital';
  const hasSidebar = !!user && !isHospital && !pathname.startsWith('/crm') && !pathname.startsWith('/admin') && pathname !== '/verify-email';

  // Wheel scroll override (config/scroll.js) — guarded for SSR
  useEffect(() => {
    if (String(pathname || '').startsWith('/doctor-chat')) return;
    if (typeof window === 'undefined') return;
    if (!scrollConfig?.enabled) return;

    const isScrollable = (el) => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(el);
      const canScrollY = /(auto|scroll)/.test(style.overflowY);
      return canScrollY && el.scrollHeight > el.clientHeight;
    };

    const scroller = document.scrollingElement || document.documentElement;

    const handler = (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      let targetEl = null;
      for (const node of path) { if (isScrollable(node)) { targetEl = node; break; } }
      if (!targetEl) targetEl = scroller;
      e.preventDefault();

      let delta = 0;
      if (scrollConfig.mode === 'viewport') {
        const frac = Math.max(0.05, Math.min(1, Number(scrollConfig.viewportFraction) || 0.25));
        const dir = Math.sign(e.deltaY || 1);
        delta = dir * Math.max(1, Math.round((targetEl.clientHeight || window.innerHeight) * frac));
      } else {
        const unit = Number(scrollConfig.lineUnit) || 16;
        let base = e.deltaMode === 1 ? (e.deltaY * unit) : (e.deltaMode === 2 ? (e.deltaY * window.innerHeight) : e.deltaY);
        const minS = Number(scrollConfig.minStep) || 24;
        const maxS = Number(scrollConfig.maxStep) || 160;
        if (Math.abs(base) < minS) base = Math.sign(base || 1) * minS;
        if (base > maxS) base = maxS; if (base < -maxS) base = -maxS;
        delta = base;
      }

      const behavior = (scrollConfig.behavior === 'auto' ? 'auto' : 'smooth');
      targetEl.scrollBy({ top: delta, behavior });
    };

    window.addEventListener('wheel', handler, { passive: false });
    return () => {
      window.removeEventListener('wheel', handler);
    };
  }, [pathname]);

  // Route değişiminde sayfayı en üste al (ancak /post/* ve geriye dönüşlerde (POP) koru)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isPostDetail = String(pathname || '').startsWith('/post/');
    if (navType === 'POP') {
      try {
        const val = sessionStorage.getItem('returnScroll');
        if (val != null) {
          const y = Number(val);
          sessionStorage.removeItem('returnScroll');
          if (!Number.isNaN(y) && y > 0) {
            const restore = () => window.scrollTo({ top: y, behavior: 'auto' });
            requestAnimationFrame(restore);
            setTimeout(restore, 100);
            setTimeout(restore, 300);
            setTimeout(restore, 600);
          }
        }
      } catch {}
      return;
    }
    if (isPostDetail) return;
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  // Auth ve CRM sayfalarında header ve cookie banner'ı gizle
  const hideOnAuthPages = ['/login', '/register', '/auth', '/doctor-login', '/clinic-login', '/hospital-login', '/admin-login', '/verify-email', '/forgot-password', '/dashboard', '/onboarding', '/clinic/onboarding'];
  const isAuthPage = hideOnAuthPages.includes(pathname);
  const isCRMPage = pathname.startsWith('/crm');
  const isAdminPage = pathname.startsWith('/admin');
  const showCookieBanner = !isAuthPage && !isCRMPage && !isAdminPage;
  const showHeader = !isAuthPage && !isCRMPage && !isAdminPage;

  // Sayfa türüne göre padding ayarı
  const pagesWithOwnContainer = [
    '/profile', '/notifications', '/doctors-departments', '/search',
    '/patient-home', '/telehealth', '/telehealth-appointment',
    '/clinic', '/medstream', '/post', '/doctor'
  ];
  const hasOwnContainer = pagesWithOwnContainer.some(page => pathname.startsWith(page));

  // Footer sadece ana site sayfalarında görünsün
  const footerOnlyOn = ['/', '/home', '/home-v2'];
  const showFooter = footerOnlyOn.includes(pathname);

  const isDoctorChat = String(pathname || '').startsWith('/doctor-chat');

  // Header/Sidebar/Footer/CookieBanner compat-shim üzerinden useSearchParams çağırabilir →
  // bunlar CSR bailout'a yol açar. Bu yüzden YALNIZCA kabuk parçaları Suspense altında.
  // {children} (sayfa içeriği) Suspense DIŞINDA render edilir; böylece server component
  // sayfalar (doctor/clinic/post detay) SSR'da gerçek içerikle gelir (SEO için kritik).
  // medstream.co — standalone Twitter-like shell: a slim top bar + the centered
  // feed only. No marketing header, sidebar, footer or cookie banner.
  if (isMedstream) {
    return (
      <BrandProvider brand="medstream">
        <div className="min-h-screen bg-white">
          <Suspense fallback={null}>
            <header className="sticky top-0 z-30 h-12 flex items-center justify-between px-4 border-b border-gray-100 bg-white/90 backdrop-blur">
              <Link to="/" className="flex items-center gap-1.5 font-bold text-[#0f766e]">
                <span className="text-base tracking-tight">MedStream</span>
              </Link>
              <LanguageSwitcher compact />
            </header>
          </Suspense>
          <Suspense fallback={null}>{children}</Suspense>
          <Suspense fallback={null}>
            <OnboardingGate />
          </Suspense>
        </div>
      </BrandProvider>
    );
  }

  return (
    <BrandProvider brand={brand}>
    <div className={hasSidebar ? 'lg:pl-[11rem]' : ''}>
      <Suspense fallback={null}>
        {showHeader && <Header />}
        {hasSidebar && <SidebarPatient />}
      </Suspense>
      <div className={showHeader ? (hasOwnContainer || isDoctorChat ? 'pt-14' : 'pt-12') : ''}>
        {/* İçerik kendi Suspense sınırında: useSearchParams kullanan sayfalar (ör. /notifications,
            /search) burada CSR bailout yapar ama doctor/clinic gibi kullanmayan sayfalar SSR'da
            gerçek içerikle gelir — bailout artık tüm kabuğu değil, sadece o sayfa altağacını kapsar. */}
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </div>
      <Suspense fallback={null}>
        {showFooter && <Footer />}
        {showCookieBanner && <CookieBanner />}
        {!isAuthPage && <ScrollToTopButton />}
        <OnboardingGate />
      </Suspense>
    </div>
    </BrandProvider>
  );
}
