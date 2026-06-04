import type { ReactNode } from 'react';

export type GameTableProps = {
  variant: 'demo' | 'play';
  id?: string;
  children?: ReactNode;
};

export function GameTable({ variant, id, children }: GameTableProps) {
  const className = variant === 'demo' ? 'mj-demo-table' : 'mj-play-table';
  return <div className={className} id={id}>{children}</div>;
}
