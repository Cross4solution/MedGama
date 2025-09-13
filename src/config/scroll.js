// Centralized scroll configuration
// Single source of truth for page scrolling behavior
// Toggle enabled to completely turn override on/off

const scrollConfig = {
  enabled: false,             // JS override KAPALI (tarayıcı varsayılanı)
  mode: 'viewport',           // 'viewport' | 'delta'
  viewportFraction: 0.25,     // fraction of visible area per wheel (viewport mode)
  behavior: 'smooth',         // 'smooth' | 'auto'
  minStep: 24,                // px; minimum step for very small deltas (delta mode)
  maxStep: 160,               // px; clamp big deltas (delta mode)
  lineUnit: 16,               // px per wheel line (delta mode)
};

export default scrollConfig;
