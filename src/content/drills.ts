export const DRILL_STATS = {
  waits: { right: 0, total: 0 },
  winornot: { right: 0, total: 0 },
  discard: { played: 0, matchedSuggestion: 0 },
};

export const DRILLS = [
  { id: 'waits', label: 'Find the wait', title: 'Find the wait', statKeys: ['right', 'total'] },
  { id: 'winornot', label: 'Win or not?', title: 'Win or not?', statKeys: ['right', 'total'] },
  { id: 'discard', label: 'Best discard', title: 'Best discard', statKeys: ['played', 'matchedSuggestion'] },
] as const;
