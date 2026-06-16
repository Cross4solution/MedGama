'use client';
// react-router-dom v6 uyumluluk shim'i — next/navigation üzerine kurulu.
// Amaç: 69 dosyadaki react-router kullanımını DEĞİŞTİRMEDEN sadece import kaynağını
// '@/compat/router' yapmak. Davranış react-router ile aynı kalır.
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';
import React, { useMemo, useCallback, useEffect } from 'react';

function toHref(to) {
  if (typeof to === 'string') return to;
  if (!to) return '#';
  return `${to.pathname || ''}${to.search || ''}${to.hash || ''}` || '#';
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((to, opts) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    const url = toHref(to);
    if (opts && opts.replace) router.replace(url);
    else router.push(url);
  }, [router]);
}

export function useLocation() {
  const pathname = usePathname();
  const sp = useNextSearchParams();
  const search = sp && sp.toString() ? `?${sp.toString()}` : '';
  return useMemo(() => ({
    pathname: pathname || '/',
    search,
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: typeof window !== 'undefined' ? (window.history.state && window.history.state.usr) || null : null,
    key: 'default',
  }), [pathname, search]);
}

export function useParams() {
  return useNextParams() || {};
}

export function useSearchParams() {
  const sp = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const setSearchParams = useCallback((next) => {
    const base = new URLSearchParams(sp ? sp.toString() : '');
    const params = typeof next === 'function' ? next(base) : new URLSearchParams(next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [sp, router, pathname]);
  return [sp || new URLSearchParams(), setSearchParams];
}

// react-router'da gezinme tipi (PUSH/POP/REPLACE). Next'te POP ayırt edilemez → PUSH varsay.
export function useNavigationType() {
  return 'PUSH';
}

export const Link = React.forwardRef(function Link({ to, replace, state, reloadDocument, ...rest }, ref) {
  return <NextLink ref={ref} href={toHref(to)} replace={replace} {...rest} />;
});

export const NavLink = React.forwardRef(function NavLink({ to, className, style, children, end, ...rest }, ref) {
  const pathname = usePathname() || '/';
  const href = typeof to === 'string' ? to : (to && to.pathname) || '';
  const isActive = end ? pathname === href : (href !== '/' ? pathname.startsWith(href) : pathname === '/');
  const cls = typeof className === 'function' ? className({ isActive }) : className;
  const sty = typeof style === 'function' ? style({ isActive }) : style;
  const kids = typeof children === 'function' ? children({ isActive }) : children;
  return <NextLink ref={ref} href={href || '#'} className={cls} style={sty} {...rest}>{kids}</NextLink>;
});

// Deklaratif yönlendirme — mount'ta yönlendirir.
export function Navigate({ to, replace = false }) {
  const router = useRouter();
  useEffect(() => {
    const url = toHref(to);
    if (replace) router.replace(url);
    else router.push(url);
  }, [to, replace, router]);
  return null;
}

// Next nested layout'lar Outlet'in yerini alır. Admin gibi nested route'larda
// children prop'u ile çalışır; bağımsız kullanımda null döner.
export function Outlet({ children }) {
  return children || null;
}
