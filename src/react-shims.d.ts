declare module 'react' {
  type ReactNode = unknown;

  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);

  function createContext<T>(defaultValue: T): {
    Provider: (props: { value: T; children?: ReactNode }) => unknown;
  };
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T;
  function useContext<T>(context: { Provider: unknown }): T;
  function useMemo<T>(factory: () => T, deps: unknown[]): T;
  function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

  export type ReactNode = unknown;
  export type MouseEventHandler<T = Element> = (event: unknown) => void;
  const React: {
    StrictMode: (props: { children?: ReactNode }) => unknown;
  };

  export { createContext, useCallback, useContext, useMemo, useState };
  export type { ReactNode };
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
