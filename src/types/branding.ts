export interface BrandingSettings {
  /** data: URL for uploaded SVG/PNG, or null for bundled default */
  logoDataUrl: string | null;
  logoAlt: string;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  logoDataUrl: null,
  logoAlt: 'CSUN Career Center',
};
