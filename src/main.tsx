import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { initMahjongRuntime } from './app.js';
import { App } from './App';
import { RulesetProvider } from './state/RulesetContext';

function RuntimeBoot() {
  useEffect(() => {
    initMahjongRuntime();
  }, []);

  return null;
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <RulesetProvider>
      <App />
      <RuntimeBoot />
    </RulesetProvider>
  </React.StrictMode>,
);
