import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RulesetProvider, RULESET_STORAGE_KEY } from '../../state/RulesetContext';
import { SideNav } from './SideNav';

describe('SideNav ruleset controls', () => {
  it('stores and highlights the selected ruleset', () => {
    window.localStorage.clear();

    render(
      <RulesetProvider>
        <SideNav />
      </RulesetProvider>,
    );

    const hongKongButton = screen.getByRole('button', { name: 'Hong Kong' });
    const singaporeButton = screen.getByRole('button', { name: 'Singapore' });

    expect(hongKongButton.classList.contains('is-active')).toBe(true);
    expect(singaporeButton.classList.contains('is-active')).toBe(false);

    fireEvent.click(singaporeButton);

    expect(window.localStorage.getItem(RULESET_STORAGE_KEY)).toBe('sg');
    expect(hongKongButton.classList.contains('is-active')).toBe(false);
    expect(singaporeButton.classList.contains('is-active')).toBe(true);
  });
});
