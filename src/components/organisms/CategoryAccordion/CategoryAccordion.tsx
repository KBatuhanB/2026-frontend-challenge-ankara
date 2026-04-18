/**
 * CategoryAccordion — Bir form kategorisinin tüm kayıtlarını gösteren organism.
 *
 * Neden organism (atom/molecule değil)?
 * → Domain verisini (Checkin, Message vb.) presentational props'a çevirir.
 *   Bu köprü görevi atom/molecule'lerin domain'den bağımsız kalmasını sağlar.
 *   Ayrıca kayıtları lokasyona göre gruplar — bu iş mantığı organism katmanında uygun.
 *
 * Lokasyon gruplama stratejisi:
 * → Records location alanına göre gruplandıktan sonra, her grup kendi
 *   AccordionItem'ına sarılır. Bu 2 seviyeli hiyerarşi oluşturur:
 *   Kategori (Sightings) → Lokasyon (Ankara Kalesi) → RecordCard'lar
 *
 * Performans: O(n) — kayıtlar tek geçişte gruplandırılır.
 */
import { useMemo } from 'react';
import { AccordionItem } from '../../molecules/AccordionItem/AccordionItem';
import { RecordCard } from '../../molecules/RecordCard/RecordCard';
import { EmptyState } from '../../atoms/EmptyState/EmptyState';
import type {
  BaseRecord,
  RecordType,
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../../../types';
import styles from './CategoryAccordion.module.css';

export interface CategoryAccordionProps {
  /** Kategori başlığı (ör. "Sightings") */
  readonly title: string;
  /** Bu kategorideki tüm kayıtlar */
  readonly records: readonly BaseRecord[];
  /** Kayıt türü — display data çıkarmak için */
  readonly recordType: RecordType;
  /** Kategori aksan rengi — sol kenar çizgisi */
  readonly accentColor: string;
  /** Varsayılan açık mı? */
  readonly defaultOpen?: boolean;
  /** Kayıt tıklandığında — FAZ 4'te detay modal açacak */
  readonly onRecordClick?: (record: BaseRecord, type: RecordType) => void;
}

/** Bir kaydın RecordCard'da gösterilecek bilgilerini çıkarır */
interface DisplayData {
  readonly title: string;
  readonly subtitle: string;
  readonly badgeLevel?: 'low' | 'medium' | 'high';
  readonly badgeLabel?: string;
}

export function CategoryAccordion({
  title,
  records,
  recordType,
  accentColor,
  defaultOpen = false,
  onRecordClick,
}: CategoryAccordionProps) {
  /**
   * Kayıtları lokasyona göre grupla — Map insertion sırası korunur (ES2015 spec).
   * O(n) zaman karmaşıklığı — tek geçiş.
   */
  const locationGroups = useMemo(() => {
    const groups = new Map<string, BaseRecord[]>();
    for (const record of records) {
      const loc = record.location || 'Bilinmeyen Konum';
      const existing = groups.get(loc);
      if (existing) {
        existing.push(record);
      } else {
        groups.set(loc, [record]);
      }
    }
    return groups;
  }, [records]);

  return (
    <AccordionItem
      title={title}
      count={records.length}
      accentColor={accentColor}
      defaultOpen={defaultOpen}
    >
      <div className={styles.content}>
        {records.length === 0 ? (
          <EmptyState message={`Bu kategoride henüz kayıt bulunmuyor.`} />
        ) : (
          /* Her lokasyon grubu bir alt-accordion olarak render edilir */
          Array.from(locationGroups.entries()).map(([location, groupRecords]) => (
            <AccordionItem
              key={location}
              title={location}
              count={groupRecords.length}
              defaultOpen={locationGroups.size <= 3}
            >
              <div className={styles.recordList}>
                {groupRecords.map((record) => {
                  const display = extractDisplayData(record, recordType);
                  return (
                    <RecordCard
                      key={record.id}
                      title={display.title}
                      subtitle={display.subtitle}
                      timestamp={record.timestamp}
                      location={record.location}
                      badgeLevel={display.badgeLevel}
                      badgeLabel={display.badgeLabel}
                      onClick={
                        onRecordClick
                          ? () => onRecordClick(record, recordType)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </AccordionItem>
          ))
        )}
      </div>
    </AccordionItem>
  );
}

/**
 * Domain record → display data dönüştürücü.
 *
 * Neden switch-case + type assertion?
 * → recordType prop'u derleme zamanında garanti eder ki doğru tipi kullanıyoruz.
 *   Runtime'da assertion güvenlidir çünkü her CategoryAccordion tek bir
 *   recordType ile oluşturulur — mixed type listesi mümkün değildir.
 *
 * Neden helper function (component dışında)?
 * → Her render'da yeniden oluşturulmaz. Pure function olduğu için
 *   React.memo olmadan bile gereksiz hesaplama yapılmaz.
 */
function extractDisplayData(record: BaseRecord, type: RecordType): DisplayData {
  switch (type) {
    case 'checkin': {
      const r = record as Checkin;
      return {
        title: r.personName,
        subtitle: r.note,
      };
    }
    case 'message': {
      const r = record as Message;
      return {
        title: `${r.senderName} → ${r.recipientName}`,
        subtitle: r.text,
        badgeLevel: r.urgency,
        badgeLabel: r.urgency,
      };
    }
    case 'sighting': {
      const r = record as Sighting;
      return {
        title: r.seenWith && r.seenWith !== 'Unknown'
          ? `${r.personName} + ${r.seenWith}`
          : r.personName,
        subtitle: r.note,
      };
    }
    case 'personalNote': {
      const r = record as PersonalNote;
      return {
        title: r.authorName,
        subtitle: r.note,
      };
    }
    case 'anonymousTip': {
      const r = record as AnonymousTip;
      return {
        title: r.suspectName,
        subtitle: r.tip,
        badgeLevel: r.confidence,
        badgeLabel: r.confidence,
      };
    }
  }
}
