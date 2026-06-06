import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { RulesetProvider, RULESET_STORAGE_KEY } from '../../state/RulesetContext';
import { SideNav } from './SideNav';

function createLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));

  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

function renderSideNav(initialStorage: Record<string, string> = {}) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: createLocalStorage(initialStorage),
      dispatchEvent: () => true,
    },
  });

  return renderToStaticMarkup(
    <RulesetProvider>
      <SideNav />
    </RulesetProvider>,
  );
}

describe('SideNav ruleset controls', () => {
  it('highlights Hong Kong by default', () => {
    const markup = renderSideNav();

    assert.match(markup, /Hong Kong<\/button>/);
    assert.match(markup, /Singapore<\/button>/);
    assert.match(markup, /mj-theme-btn is-active[^>]*>Hong Kong/);
  });

  it('highlights a Singapore ruleset loaded from localStorage', () => {
    const markup = renderSideNav({ [RULESET_STORAGE_KEY]: 'sg' });

    assert.match(markup, /mj-theme-btn is-active[^>]*>Singapore/);
    assert.match(markup, /mj-theme-btn[^>]*>Hong Kong/);
  });
});
