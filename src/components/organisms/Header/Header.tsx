/**
 * Header — Soruşturma panosu başlığı.
 *
 * Neden statik bileşen (prop almıyor)?
 * → Header içeriği uygulama genelinde sabittir ve dinamik veri gerektirmez.
 *   Prop almayan bileşenler React.memo'ya gerek kalmadan memoize edilir.
 *
 * Neden serif font başlıkta?
 * → Playfair Display serif fontı gazete manşeti / soruşturma dosyası
 *   estetiğini güçlendirir. Sans-serif gövde fontu (DM Sans) ile kontrast
 *   oluşturarak görsel hiyerarşi yaratır.
 */
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        {/* Üst etiket — dosya numarası hissi */}
        <span className={styles.caseLabel}>CASE FILE #2026-ANK</span>

        <h1 className={styles.title}>
          Missing Podo
          <span className={styles.subtitle}>The Ankara Case</span>
        </h1>

        <p className={styles.description}>
          Soruşturma panosu — 5 farklı veri kaynağından toplanan kanıtlar,
          tanık ifadeleri ve anonim ihbarlar. Podo'yu bulmamıza yardım edin.
        </p>

        {/* Alt dekoratif çizgi — dosya kenarı hissi */}
        <div className={styles.divider} aria-hidden="true" />
      </div>
    </header>
  );
}
