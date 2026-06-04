import { MobileTopbar } from './components/layout/MobileTopbar';
import { SideNav } from './components/layout/SideNav';
import { Footer } from './components/layout/Footer';
import { ActionsSection } from './components/sections/ActionsSection';
import { DemoSection } from './components/sections/DemoSection';
import { DrillsSection } from './components/sections/DrillsSection';
import { GameFlowSection } from './components/sections/GameFlowSection';
import { HeroSection } from './components/sections/HeroSection';
import { PlaySection } from './components/sections/PlaySection';
import { ScenarioSection } from './components/sections/ScenarioSection';
import { ScoringSection } from './components/sections/ScoringSection';
import { TileExplorerSection } from './components/sections/TileExplorerSection';
import { WinningHandSection } from './components/sections/WinningHandSection';

export function App() {
  return (
    <>
      <SideNav />
      <MobileTopbar />

      <main className="mj-main" id="top">
        <HeroSection />
        <TileExplorerSection />
        <WinningHandSection />
        <GameFlowSection />
        <ActionsSection />
        <ScoringSection />
        <ScenarioSection />
        <DrillsSection />
        <DemoSection />
        <PlaySection />
        <Footer />
      </main>
    </>
  );
}
