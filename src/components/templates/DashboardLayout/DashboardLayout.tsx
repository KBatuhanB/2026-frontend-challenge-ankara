/**
 * DashboardLayout — Soruşturma panosu iskelet yapısı.
 *
 * Neden ayrı bir template?
 * → Atomic Design'da template, sayfanın yapısal iskeletini tanımlar.
 *   İçerik (organisms) dışarıdan children olarak gelir.
 *   Bu sayede aynı layout farklı sayfalarla kullanılabilir (SRP, OCP).
 *
 * Yapı:
 * ┌─────────────────────────────┐
 * │         HEADER              │
 * ├─────────────────────────────┤
 * │       SEARCH BAR            │  ← Sticky
 * ├─────────────────────────────┤
 * │       {children}            │  ← Ana içerik
 * └─────────────────────────────┘
 */
import type { ReactNode } from 'react';
import { Header } from '../../organisms/Header/Header';
import { SearchBar, type SearchBarProps } from '../../organisms/SearchBar/SearchBar';
import styles from './DashboardLayout.module.css';

export interface DashboardLayoutProps {
  /** SearchBar'a iletilecek props */
  readonly searchBarProps: SearchBarProps;
  /** Ana içerik alanı */
  readonly children: ReactNode;
}

export function DashboardLayout({ searchBarProps, children }: DashboardLayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      <SearchBar {...searchBarProps} />
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
