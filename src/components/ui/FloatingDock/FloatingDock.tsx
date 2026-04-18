/**
 * FloatingDock — macOS dock tarzı animasyonlu navigasyon çubuğu.
 *
 * Aceternity UI'dan adapte edildi, CSS Modules + framer-motion ile.
 * React Router <Link> desteği — SPA navigasyonu.
 *
 * Hover efekti:
 * → Fare imleci bir ikon üzerindeyken o ikon büyür (scale).
 *   Komşu ikonlar da hafifçe büyür — manyetik büyüteç efekti.
 *   framer-motion useMotionValue + useTransform ile GPU-hızlandırmalı.
 *
 * @see https://ui.aceternity.com/components/floating-dock
 */
import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import styles from './FloatingDock.module.css';

export interface DockItem {
  /** Tooltip başlığı */
  readonly title: string;
  /** React ikon bileşeni */
  readonly icon: React.ReactNode;
  /** React Router navigasyon yolu */
  readonly href: string;
}

export interface FloatingDockProps {
  /** Dock öğeleri */
  readonly items: readonly DockItem[];
}

export function FloatingDock({ items }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className={styles.dockWrapper}>
    <motion.nav
      className={styles.dock}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      aria-label="Ana navigasyon"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
    >
      {items.map((item) => (
        <DockIcon key={item.href} mouseX={mouseX} item={item} />
      ))}
    </motion.nav>
    </div>
  );
}

/* ─── Tek Dock İkonu ─── */

interface DockIconProps {
  readonly mouseX: MotionValue<number>;
  readonly item: DockItem;
}

function DockIcon({ mouseX, item }: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActive = location.pathname === item.href;

  /**
   * Fare mesafesine göre boyut hesabı.
   * → Fare ikona yaklaştıkça boyut büyür (40→70px).
   *   distance [-150, 0, 150] aralığında transform uygulanır.
   *   Spring animasyon ile yumuşak geçiş.
   */
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const iconSizeTransform = useTransform(distance, [-150, 0, 150], [20, 36, 20]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const iconSize = useSpring(iconSizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link to={item.href} className={styles.link} aria-label={item.title}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        className={`${styles.iconContainer} ${isActive ? styles.active : ''}`}
      >
        {/* Tooltip */}
        <motion.span
          className={styles.tooltip}
          initial={{ opacity: 0, y: 10, x: '-50%' }}
          whileHover={{ opacity: 1, y: 0, x: '-50%' }}
          transition={{ duration: 0.15 }}
        >
          {item.title}
        </motion.span>

        {/* İkon */}
        <motion.div style={{ width: iconSize, height: iconSize }} className={styles.icon}>
          {item.icon}
        </motion.div>

        {/* Aktif sayfa indikatörü */}
        {isActive && (
          <motion.div
            className={styles.activeIndicator}
            layoutId="dock-indicator"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        )}
      </motion.div>
    </Link>
  );
}
