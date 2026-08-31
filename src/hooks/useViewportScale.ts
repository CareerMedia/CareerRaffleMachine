import { useEffect, useState } from 'react';

export function useViewportScale(stageWidth = 1920, stageHeight = 1080) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / stageWidth;
      const scaleY = vh / stageHeight;
      setScale(Math.min(scaleX, scaleY));
    }

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [stageWidth, stageHeight]);

  return scale;
}
