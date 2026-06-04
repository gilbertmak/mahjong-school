import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Ruleset = 'hk' | 'sg';

export const RULESET_STORAGE_KEY = 'mj-ruleset';

const VALID_RULESETS: Ruleset[] = ['hk', 'sg'];

type RulesetCopy = {
  kicker: string;
  tilecount: string;
  min: string;
  unit: string;
  unitcap: string;
  variantName: string;
  scoringLede: ReactNode;
  minSentence: string;
  bonusReveal: ReactNode;
  bonusNote: ReactNode;
};

type RulesetContextValue = {
  ruleset: Ruleset;
  setRuleset: (ruleset: Ruleset) => void;
};

const RulesetContext = createContext<RulesetContextValue | undefined>(undefined);

function isRuleset(value: string | null): value is Ruleset {
  return VALID_RULESETS.includes(value as Ruleset);
}

function getInitialRuleset(): Ruleset {
  try {
    const stored = window.localStorage.getItem(RULESET_STORAGE_KEY);
    if (isRuleset(stored)) return stored;
  } catch {
    // Fall back to Hong Kong when storage is unavailable.
  }
  return 'hk';
}

export function getRulesetCopy(ruleset: Ruleset): RulesetCopy {
  if (ruleset === 'sg') {
    return {
      kicker: 'Singapore rules · 新加坡麻將',
      tilecount: '148',
      min: '1',
      unit: 'tai',
      unitcap: 'Tai',
      variantName: 'Singapore Style',
      scoringLede: <>Singapore counts in <em>tai</em> (台), each one doubling the payout. The bar to declare is low — usually just <strong>≥1 tai</strong> — and patterns add up, but the total is normally capped at 5 tai, with anything bigger paying the same. Singapore also throws in <em>animal tiles</em> (cat, rat, rooster, centipede), each good for 1 tai.</>,
      minSentence: 'usually just 1 tai — Singapore is friendly that way — though winnings are typically capped at 5 tai.',
      bonusReveal: <>Holding a <em>flower</em>, <em>season</em> or <em>animal</em>? Flip it face-up and draw a fresh tile from the tail of the wall (the &quot;dead wall&quot;). Repeat until no one is holding a bonus. Animals behave like flowers — they rest beside your hand and never go into sets.</>,
      bonusNote: <>Same during play: a flower or animal you draw goes face-up at once and is replaced from the dead wall. Animals pay win or lose, and snagging both halves of a hunter-and-hunted pair (cat–rat or rooster–centipede) settles up immediately.</>,
    };
  }

  return {
    kicker: 'Hong Kong rules · 香港麻將',
    tilecount: '144',
    min: '3',
    unit: 'faan',
    unitcap: 'Faan',
    variantName: 'Hong Kong Old Style',
    scoringLede: <>Hong Kong counts in <em>faan</em> (番), where each one doubles the payout. You usually need <strong>≥3 faan</strong> before a hand can be declared, and patterns add together — one hand can tick several boxes. Reach about 10 faan and most tables cap it as a &quot;limit&quot; hand.</>,
    minSentence: 'usually 3 faan. Check first, though — easygoing tables drop it to 1, stricter ones push it to 5.',
    bonusReveal: <>Got a <em>flower</em> or <em>season</em>? Flip it face-up and pull a fresh tile from the tail of the wall (the &quot;dead wall&quot;). Keep going until nobody is holding a bonus tile.</>,
    bonusNote: <>It works the same mid-game: the moment you draw a flower, show it and replace it from the dead wall.</>,
  };
}

export function RulesetProvider({ children }: { children: ReactNode }) {
  const [ruleset, setRulesetState] = useState<Ruleset>(getInitialRuleset);

  const setRuleset = useCallback((nextRuleset: Ruleset) => {
    setRulesetState(nextRuleset);
    try {
      window.localStorage.setItem(RULESET_STORAGE_KEY, nextRuleset);
    } catch {
      // Keep the in-memory React state even when storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent('mj-ruleset-change', { detail: { ruleset: nextRuleset } }));
  }, []);

  const value = useMemo(() => ({ ruleset, setRuleset }), [ruleset, setRuleset]);

  return <RulesetContext.Provider value={value}>{children}</RulesetContext.Provider>;
}

export function useRuleset() {
  const value = useContext(RulesetContext) as RulesetContextValue | undefined;
  if (!value) throw new Error('useRuleset must be used within RulesetProvider');
  return value;
}

export function useRulesetCopy() {
  const { ruleset } = useRuleset();
  return getRulesetCopy(ruleset);
}
