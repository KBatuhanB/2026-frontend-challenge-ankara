/**
 * HomePage — Ana soruşturma giriş sayfası.
 *
 * Tasarım konsepti:
 * → Karanlık soruşturma odası atmosferi. Sparkles arka planı —
 *   havada süzülen toz parçacıkları gibi. Ortada başlık + arama.
 *   Alt kısımda 3 navigasyon kartı (Records, Timeline, Map).
 *   Arama yapıldığında kartlar kaybolur, Google tarzı sonuçlar belirir.
 *
 * Akış:
 *   1. Kullanıcı sayfayı açar → cinematic intro (staggered reveal)
 *   2. Arama kutusuna yazar → sonuçlar anında belirir
 *   3. Sonuca tıklar → RecordDetailModal açılır
 *   4. Navigasyon kartına tıklar → alt sayfaya gider
 */
import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAllData } from '../../../api/hooks';
import { SparklesCore } from '../../ui/SparklesCore/SparklesCore';
import { SearchInput } from '../../atoms/SearchInput/SearchInput';
import { SearchResults } from '../../organisms/SearchResults/SearchResults';
import { Spinner } from '../../atoms/Spinner/Spinner';
import type { FilterableData } from '../../../utils/filterRecords';
import {
  IconFiles,
  IconTimeline,
  IconMap,
} from '@tabler/icons-react';
import styles from './HomePage.module.css';

/** Navigasyon kartı verisi */
const NAV_CARDS = [
  {
    to: '/records',
    icon: IconFiles,
    title: 'Case Records',
    description: '5 farklı kaynaktan toplanan soruşturma kayıtları',
    count: 'Checkins, Messages, Sightings, Notes, Tips',
    accent: 'var(--color-accent-info)',
  },
  {
    to: '/timeline',
    icon: IconTimeline,
    title: "Podo's Timeline",
    description: "Podo'nun kronolojik rotası ve şüphe analizi",
    count: 'Son Görülme • En Şüpheli • Kronoloji',
    accent: 'var(--color-accent-gold)',
  },
  {
    to: '/map',
    icon: IconMap,
    title: 'Investigation Map',
    description: "Ankara üzerinde tüm olay noktaları ve Podo'nun rotası",
    count: 'Leaflet • Markers • Polyline',
    accent: 'var(--color-accent-high)',
  },
] as const;

export function HomePage() {
  const { isLoading, ...data } = useAllData();
  const [searchQuery, setSearchQuery] = useState('');

  const allData = useMemo<FilterableData>(() => ({
    checkins: data.checkins,
    messages: data.messages,
    sightings: data.sightings,
    personalNotes: data.personalNotes,
    anonymousTips: data.anonymousTips,
  }), [data.checkins, data.messages, data.sightings, data.personalNotes, data.anonymousTips]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const isSearching = searchQuery.trim().length >= 2;

  return (
    <div className={styles.page}>
      {/* ─── Sparkles Arka Plan ─── */}
      <div className={styles.sparklesWrapper}>
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={80}
          particleColor="#c8a55a"
          speed={0.3}
        />
      </div>

      {/* ─── Gradient Çizgiler (Aceternity stili) ─── */}
      <div className={styles.gradientLines}>
        <div className={styles.gradientWide} />
        <div className={styles.gradientWideThin} />
        <div className={styles.gradientNarrow} />
        <div className={styles.gradientNarrowThin} />
      </div>

      {/* ─── Ana İçerik ─── */}
      <div className={styles.content}>
        {/* Başlık bölümü — staggered reveal */}
        <motion.div
          className={styles.hero}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.span
            className={styles.caseLabel}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 0.8, y: 0 },
            }}
            transition={{ duration: 0.5 }}
          >
            CASE FILE #2026-ANK
          </motion.span>

          <motion.h1
            className={styles.title}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6 }}
          >
            Missing Podo
          </motion.h1>

          <motion.span
            className={styles.subtitle}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
          >
            The Ankara Case
          </motion.span>

          <motion.p
            className={styles.description}
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
          >
            Soruşturma panosu — 5 farklı veri kaynağından toplanan kanıtlar,
            tanık ifadeleri ve anonim ihbarlar.
          </motion.p>
        </motion.div>

        {/* Arama Çubuğu */}
        <motion.div
          className={styles.searchWrapper}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {isLoading ? (
            <div className={styles.loadingSearch}>
              <Spinner size="sm" />
              <span>Veriler yükleniyor...</span>
            </div>
          ) : (
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Kayıtlarda ara... (isim, lokasyon, not, mesaj)"
            />
          )}
        </motion.div>

        {/* Arama Sonuçları — Google tarzı */}
        {isSearching && !isLoading && (
          <motion.div
            className={styles.searchResults}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SearchResults query={searchQuery} data={allData} />
          </motion.div>
        )}

        {/* Navigasyon Kartları — arama yokken göster */}
        {!isSearching && (
          <motion.div
            className={styles.navCards}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.9 } },
            }}
          >
            {NAV_CARDS.map((card) => (
              <motion.div
                key={card.to}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
              >
                <Link to={card.to} className={styles.navCard}>
                  <div className={styles.navCardIcon} style={{ color: card.accent }}>
                    <card.icon size={28} stroke={1.5} />
                  </div>
                  <div className={styles.navCardContent}>
                    <h3 className={styles.navCardTitle}>{card.title}</h3>
                    <p className={styles.navCardDesc}>{card.description}</p>
                    <span className={styles.navCardMeta}>{card.count}</span>
                  </div>
                  <span className={styles.navCardArrow} style={{ color: card.accent }}>→</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Radyal Gradient Mask — alt kısımdaki keskin kenarları gizler */}
      <div className={styles.radialMask} />
    </div>
  );
}
