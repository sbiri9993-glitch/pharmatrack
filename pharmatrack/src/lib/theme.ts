export const lightTheme = {
  isDark: false,
  colors: {
    primary:        '#1D9E75',
    primaryDark:    '#0F6E56',
    primaryLight:   '#5DCAA5',
    primaryBg:      '#EBF7F2',
    success:        '#2D7A3A',
    danger:         '#C93535',
    warning:        '#A05E1A',
    info:           '#1A6FB5',
    text:           '#0A0A0A',
    textSecondary:  '#525252',
    textTertiary:   '#A3A3A3',
    border:         '#E5E5E5',
    borderStrong:   '#D4D4D4',
    surface:        '#FFFFFF',
    surfaceElevated:'#F5F5F5',
    background:     '#FAFAFA',
  },
};

export const darkTheme = {
  isDark: true,
  colors: {
    primary:        '#2EBD8E',
    primaryDark:    '#1D9E75',
    primaryLight:   '#5DCAA5',
    primaryBg:      '#0A2018',
    success:        '#4CAF6A',
    danger:         '#E05555',
    warning:        '#C4813A',
    info:           '#4A8FD4',
    text:           '#FAFAFA',
    textSecondary:  '#A3A3A3',
    textTertiary:   '#6B6B6B',
    border:         '#262626',
    borderStrong:   '#333333',
    surface:        '#141414',
    surfaceElevated:'#1C1C1C',
    background:     '#0A0A0A',
  },
};

export type Theme = typeof lightTheme;
