/**
 * SparklesCore — tsparticles tabanlı parçacık arka plan efekti.
 *
 * Aceternity UI'dan adapte edildi, CSS Modules ile yeniden stillendirildi.
 * Case File Noir temasına uygun altın parçacıklar.
 *
 * Neden @tsparticles/react?
 * → Canvas tabanlı performanslı parçacık motoru. requestAnimationFrame
 *   ile GPU-hızlandırmalı render. React lifecycle ile uyumlu cleanup.
 *
 * @see https://ui.aceternity.com/components/sparkles
 */
import { useEffect, useState, useId } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';
import styles from './SparklesCore.module.css';

export interface SparklesCoreProps {
  /** Arka plan rengi — varsayılan transparent */
  readonly background?: string;
  /** Minimum parçacık boyutu */
  readonly minSize?: number;
  /** Maksimum parçacık boyutu */
  readonly maxSize?: number;
  /** Parçacık yoğunluğu (daha büyük = daha fazla parçacık) */
  readonly particleDensity?: number;
  /** Parçacık rengi */
  readonly particleColor?: string;
  /** Parçacık hızı */
  readonly speed?: number;
  /** Ek CSS class */
  readonly className?: string;
}

export function SparklesCore({
  background = 'transparent',
  minSize = 0.4,
  maxSize = 1,
  particleDensity = 1200,
  particleColor = '#FFFFFF',
  speed = 1,
  className,
}: SparklesCoreProps) {
  const [isReady, setIsReady] = useState(false);
  const generatedId = useId();

  /**
   * Motor başlatma — uygulama ömrü boyunca bir kez.
   * loadSlim ile minimal preset yüklenir (full preset'in ~%30'u).
   */
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setIsReady(true));
  }, []);

  /**
   * tsparticles konfigürasyonu.
   * Neden inline değil de değişken?
   * → Büyük obje literal'i JSX içinde okunabilirliği düşürür.
   *   Ayrı tanımlayınca IDE type-check yapabilir.
   */
  const options: ISourceOptions = {
    background: { color: { value: background } },
    fullScreen: { enable: false },
    fpsLimit: 30,
    interactivity: {
      events: {
        onClick: { enable: false },
        onHover: { enable: false },
      },
    },
    particles: {
      color: { value: particleColor },
      move: {
        enable: true,
        direction: 'none',
        outModes: { default: 'out' },
        random: false,
        speed,
        straight: false,
      },
      number: {
        density: { enable: true, width: 400, height: 400 },
        value: particleDensity,
      },
      opacity: {
        value: { min: 0.1, max: 1 },
        animation: {
          enable: true,
          speed: 1,
          startValue: 'random',
          destroy: 'none',
        },
      },
      shape: { type: 'circle' },
      size: {
        value: { min: minSize, max: maxSize },
      },
    },
    detectRetina: true,
  };

  if (!isReady) return null;

  return (
    <Particles
      id={generatedId}
      className={`${styles.particles} ${className ?? ''}`}
      options={options}
    />
  );
}
