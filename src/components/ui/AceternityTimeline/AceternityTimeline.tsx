/**
 * AceternityTimeline — Aceternity UI Timeline bileşeni (CSS Modules adaptasyonu).
 *
 * Aceternity UI'dan adapte edildi, CSS Modules + framer-motion ile.
 * Tailwind class'lar CSS Modules'a dönüştürüldü — proje convention'ına uyum.
 *
 * Özellikler:
 *   1. Sticky başlık — scroll sırasında aktif bölüm sabitlenir
 *   2. Scroll-beam — sayfa kaydırıldıkça dikey çizgi dolar (progress efekti)
 *   3. Sol nokta + sağ içerik düzeni — klasik timeline layout
 *   4. Responsive — mobilde başlık içerik üstüne kayar
 *
 * Teknik:
 * → framer-motion useScroll + useTransform ile scroll-based animasyon.
 *   Height beam'i, scroll ilerledikçe orantılı büyür.
 *   useMotionValueEvent ile mevcut scroll pozisyonu takip edilir.
 *
 * @see https://ui.aceternity.com/components/timeline
 */
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import styles from './AceternityTimeline.module.css';

/** Her timeline girişinin veri modeli — Aceternity API uyumlu */
export interface TimelineEntry {
  /** Zaman etiketi — sol sticky sütunda gösterilir */
  readonly title: string;
  /** İçerik — sağ sütunda render edilecek JSX */
  readonly content: React.ReactNode;
  /** Vurgu mu? — nokta ve başlık kırmızıya döner (opsiyonel) */
  readonly isHighlight?: boolean;
}

export interface AceternityTimelineProps {
  /** Timeline verileri — kronolojik sıralı */
  readonly data: readonly TimelineEntry[];
}

export function AceternityTimeline({ data }: AceternityTimelineProps) {
  /** Timeline gövde referansı — yükseklik hesabı için */
  const ref = useRef<HTMLDivElement>(null);
  /** Dış konteyner referansı — scroll tracking için */
  const containerRef = useRef<HTMLDivElement>(null);
  /** Timeline gövdesinin piksel yüksekliği — beam çizgisi için */
  const [height, setHeight] = useState(0);

  /**
   * Timeline gövde yüksekliğini ölç.
   * Neden useEffect?
   * → İlk render sonrası DOM ölçümü gerekli. ResizeObserver kullanmak
   *   daha robust olurdu ancak Aceternity orijinali de bu yaklaşımı
   *   kullanıyor ve ~12 kayıtlık veri setinde resize edge case'i yok.
   */
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  /**
   * Scroll progress hesabı:
   * → target: dış konteyner
   * → offset: "start 10%" (konteyner ekranın %10'unda) → "end 50%" (ekranın %50'sinde)
   *   Bu aralıkta scrollYProgress 0→1 arasında değişir.
   *   Beam height ve opacity bu değere bağlı.
   */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  });

  /** Scroll progress → beam yüksekliği (px) */
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  /** Scroll başlangıcında beam opaklığı fade-in */
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {/* Timeline gövdesi — tüm entry'ler + dikey çizgi */}
      <div ref={ref} className={styles.timelineBody}>
        {data.map((item, index) => (
          <div key={index} className={styles.entryRow}>
            {/* Sol: sticky başlık + timeline noktası */}
            <div className={styles.stickyColumn}>
              {/* Nokta konteyner — timeline çizgisi üzerindeki daire */}
              <div className={styles.dotOuter}>
                <div
                  className={`${styles.dotInner} ${
                    item.isHighlight ? styles.dotHighlight : ''
                  }`}
                />
              </div>
              {/* Desktop başlık — sticky olarak sabitlenir */}
              <h3
                className={`${styles.titleDesktop} ${
                  item.isHighlight ? styles.titleHighlight : ''
                }`}
              >
                {item.title}
              </h3>
            </div>

            {/* Sağ: içerik alanı */}
            <div className={styles.contentColumn}>
              {/* Mobil başlık — içerik üstünde görünür */}
              <h3
                className={`${styles.titleMobile} ${
                  item.isHighlight ? styles.titleHighlight : ''
                }`}
              >
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Dikey timeline çizgisi — beam animasyonu ile */}
        <div
          style={{ height: `${height}px` }}
          className={styles.trackContainer}
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className={styles.scrollBeam}
          />
        </div>
      </div>
    </div>
  );
}
