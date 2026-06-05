declare module 'vitest' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: any;
}

declare module '@testing-library/react' {
  import type { ReactNode } from 'react';

  export function render(ui: ReactNode): unknown;
  export const fireEvent: {
    click: (element: Element) => void;
  };
  export const screen: {
    getByRole: (role: string, options?: { name?: string | RegExp }) => HTMLElement;
  };
}
