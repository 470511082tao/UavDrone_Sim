import { createGlobalStyle, DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#333333',
    textLight: '#666666',
    error: '#e74c3c',
    success: '#2ecc71',
    warning: '#f39c12',
    info: '#3498db',
  },
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    circle: '50%',
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px',
    },
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
};

export const GlobalStyle = createGlobalStyle`
  /* 全局样式在index.css中定义 */
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  button {
    cursor: pointer;
  }
`;

// 给styled-components添加类型定义
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textLight: string;
      error: string;
      success: string;
      warning: string;
      info: string;
    };
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      circle: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
    };
    typography: {
      fontFamily: string;
      fontSizes: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
      };
      fontWeights: {
        light: number;
        regular: number;
        medium: number;
        bold: number;
      };
    };
  }
} 