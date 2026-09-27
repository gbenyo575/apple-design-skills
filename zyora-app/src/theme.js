import { Easing } from 'react-native-reanimated';

// Zyora design tokens. The brand purples (#8A73FF / #BBAEFF / #5F45F3) are
// unchanged from v0.4; everything else is tuned around them.
export const colors = {
  // Surfaces, darkest to lightest
  bg: '#0D0C12',
  surface: '#16131C',
  surface2: '#1D1925',
  surface3: '#27222F',
  hairline: 'rgba(255,255,255,0.07)',
  hairlineStrong: 'rgba(255,255,255,0.12)',
  scrim: 'rgba(5,4,8,0.62)',

  // Text
  text: '#F8F6FC',
  textSecondary: '#A7A0B3',
  textTertiary: '#716A7C',

  // Brand
  purple: '#8A73FF',
  purpleLight: '#BBAEFF',
  purpleDeep: '#5F45F3',
  purpleFill: '#7159F9', // filled buttons: brand hue with AA contrast for white text
  purpleTint: 'rgba(138,115,255,0.14)',
  purpleTintStrong: 'rgba(138,115,255,0.24)',

  // Semantic
  green: '#5EE6A8',
  greenTint: 'rgba(94,230,168,0.12)',
  red: '#FF7A8D',
  redTint: 'rgba(255,122,141,0.13)',
  orange: '#FFB36B',
  orangeTint: 'rgba(255,179,107,0.13)',
  blue: '#75C7FF',
  blueTint: 'rgba(117,199,255,0.13)',

  // Money-flow roles, used consistently in every chart and legend. Validated
  // with the dataviz palette checker against `surface` (dark band, CVD-safe);
  // `fixed` is the de-emphasis gray, not a series hue.
  spendable: '#8A73FF',
  protected: '#2FA877',
  fixed: '#4A4356',
  pace: '#6B6378',

  white: '#FFFFFF',
  black: '#08070B',
};

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 44 };
export const gutter = 20;

export const radii = { xs: 8, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

// Size-specific tracking: large text tightens, small text stays neutral.
export const type = {
  display: { fontSize: 46, lineHeight: 52, fontWeight: '700', letterSpacing: -1.6 },
  largeTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400', letterSpacing: -0.1 },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500', letterSpacing: -0.1 },
  subhead: { fontSize: 14, lineHeight: 19, fontWeight: '400', letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.1 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 },
};

// Motion vocabulary (see skills/animate-expo). Never ease-in on UI.
// Durations live next to each animation: press 120 ms, toggles 200–250 ms,
// sheets 300 ms in / 220 ms out, springs { duration: 300, dampingRatio: 0.8 }.
export const easing = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  sheet: Easing.bezier(0.32, 0.72, 0, 1),
};

export const TAB_BAR_HEIGHT = 58;
