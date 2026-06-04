declare module 'react' {
  export type ReactNode = unknown;
  export type MouseEventHandler<T = Element> = (event: unknown) => void;
  const React: {
    StrictMode: (props: { children?: unknown }) => unknown;
  };
  export default React;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element): {
    render(children: unknown): void;
  };
}

declare module 'react-dom/server' {
  export function renderToStaticMarkup(element: unknown): string;
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

declare namespace JSX {
  interface IntrinsicAttributes {
    key?: unknown;
  }

  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module '*.css';
