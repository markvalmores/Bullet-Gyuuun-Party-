import { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../lib/sound';

interface FeverAnimationConfig {
  combo: number;
  isFever: boolean;
}

export function useFeverMode({ combo, isFever }: FeverAnimationConfig) {
  const [screenShake, setScreenShake] = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [feverBurstGlow, setFeverBurstGlow] = useState(false);
  const prevComboRef = useRef(combo);

  // Trigger violent screen shake and intense particle glow when reaching 50+ combo milestones
  useEffect(() => {
    if (combo >= 50 && prevComboRef.current < 50) {
      playSound('fever');
      setScreenShake(true);
      setFeverBurstGlow(true);

      const timer1 = setTimeout(() => setScreenShake(false), 800);
      const timer2 = setTimeout(() => setFeverBurstGlow(false), 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
    prevComboRef.current = combo;
  }, [combo]);

  // Continuous subtle screen shake during intense Fever Mode or 50+ combo
  useEffect(() => {
    if (!isFever && combo < 50) {
      setShakeOffset({ x: 0, y: 0 });
      return;
    }

    let frameId: number;
    const animateShake = () => {
      const intensity = combo >= 50 ? (isFever ? 12 : 8) : 4;
      setShakeOffset({
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
      });
      frameId = requestAnimationFrame(animateShake);
    };

    frameId = requestAnimationFrame(animateShake);
    return () => cancelAnimationFrame(frameId);
  }, [isFever, combo]);

  return {
    shakeOffset,
    screenShake,
    feverBurstGlow,
    isCombo50Plus: combo >= 50,
  };
}
