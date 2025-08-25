import { Platform } from 'react-native';

export const typography = {
  // System defaults for a clean, consistent look without bundling custom fonts
  fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) as string,
  sizes: {
    display: 45,
    title: 24,
    heading: 18,
    body: 14,
    caption: 12,
  },
  weights: {
    regular: '400',
    medium: '500',
    bold: '700',
  } as const,
};


