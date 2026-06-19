'use client';
import React, { createContext, useContext } from 'react';

// Brand context — distinguishes the main MedaGama site from the standalone
// MedStream experience (medstream.co). Set server-side from the x-brand header
// (middleware) so it's consistent across SSR + client (no hydration flash).
const BrandContext = createContext('medagama');

export function BrandProvider({ brand, children }) {
  return <BrandContext.Provider value={brand || 'medagama'}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}

export function useIsMedstream() {
  return useContext(BrandContext) === 'medstream';
}
