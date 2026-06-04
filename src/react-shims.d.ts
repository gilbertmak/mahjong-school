declare module 'react' {
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

declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module '*.css';
