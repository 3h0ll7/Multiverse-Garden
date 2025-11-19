import React, { useState } from 'react';
import GardenCanvas from './components/GardenCanvas';
import UIOverlay from './components/UIOverlay';
import { ThemeType } from './constants';

function App() {
  const [theme, setTheme] = useState<ThemeType>(ThemeType.MORNING_GLOW);
  const [recorderStream, setRecorderStream] = useState<MediaStream | null>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* The Interactive Visual World */}
      <GardenCanvas 
        themeType={theme} 
        setRecorderStream={setRecorderStream} 
      />

      {/* The Interface Layer */}
      <UIOverlay 
        currentTheme={theme} 
        setTheme={setTheme}
        recorderStream={recorderStream}
      />
    </div>
  );
}

export default App;
