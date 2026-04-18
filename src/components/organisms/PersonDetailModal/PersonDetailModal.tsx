/**
 * PersonDetailModal — Kişi profil modal'ı.
 *
 * Neden organism?
 * → buildPersonProfiles çıktısını (Person interface) alır ve
 *   kategorize edilmiş kayıt listesiyle sunar.
 *   Domain mantığı + sunum = organism seviyesi.
 *
 * Person bulma stratejisi:
 * → normalizedName ile eşleştirilir. Neden?
 *   Farklı yazımlar (Kağan / Kagan / Kağan A.) aynı kişiye karşılık gelir.
 *   normalizeName fonksiyonu bu eşleştirmeyi tutarlı kılar.
 *
 * Kayıt gösterimi:
 * → Person interface 8 farklı kategori barındırır (checkins, sentMessages vb.).
 *   Her kategori için Accordion veya basit liste kullanılır.
 */
import { useMemo } from 'react';
import { Modal } from '../../atoms/Modal/Modal';
import { Badge } from '../../atoms/Badge/Badge';
import { RecordCard } from '../../molecules/RecordCard/RecordCard';
import type { Person } from '../../../types/person';
import type {
  BaseRecord,
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../../../types';
import styles from './PersonDetailModal.module.css';

export interface PersonDetailModalProps {
  /** Kişi profili — null ise modal kapalı */
  readonly person: Person | null;
  /** Kapatma callback'i */
  readonly onClose: () => void;
  /** Bir kayda tıklanınca — RecordDetailModal'a geçiş */
  readonly onRecordClick?: (record: BaseRecord, type: import('../../../types').RecordType) => void;
}

/** Kategori tanımı — label + kayıt listesi + kayıt tipinden display veri çıkarma */
interface CategorySection {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly count: number;
  readonly render: () => React.ReactNode;
}

export function PersonDetailModal({
  person,
  onClose,
  onRecordClick,
}: PersonDetailModalProps) {
  /**
   * Kategorileri hazırla — memoize çünkü person değişmediği sürece
   * aynı JSX'i yeniden oluşturmaya gerek yok.
   */
  const categories = useMemo<CategorySection[]>(() => {
    if (!person) return [];

    return [
      {
        key: 'checkins',
        label: 'Check-ins',
        icon: '📍',
        count: person.checkins.length,
        render: () =>
          person.checkins.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'checkin')}
            >
              <RecordCard
                title={r.location}
                subtitle={r.note ?? ''}
                timestamp={r.timestamp}
                location={r.location}
              />
            </button>
          )),
      },
      {
        key: 'sentMessages',
        label: 'Sent Messages',
        icon: '📤',
        count: person.sentMessages.length,
        render: () =>
          person.sentMessages.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'message')}
            >
              <RecordCard
                title={`To: ${r.recipientName}`}
                subtitle={r.text}
                timestamp={r.timestamp}
                location={r.location}
                badgeLevel={r.urgency}
              />
            </button>
          )),
      },
      {
        key: 'receivedMessages',
        label: 'Received Messages',
        icon: '📥',
        count: person.receivedMessages.length,
        render: () =>
          person.receivedMessages.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'message')}
            >
              <RecordCard
                title={`From: ${r.senderName}`}
                subtitle={r.text}
                timestamp={r.timestamp}
                location={r.location}
                badgeLevel={r.urgency}
              />
            </button>
          )),
      },
      {
        key: 'sightings',
        label: 'Sightings',
        icon: '👁',
        count: person.sightings.length,
        render: () =>
          person.sightings.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'sighting')}
            >
              <RecordCard
                title={r.seenWith && r.seenWith !== 'Unknown' ? `With: ${r.seenWith}` : r.location}
                subtitle={r.note ?? ''}
                timestamp={r.timestamp}
                location={r.location}
              />
            </button>
          )),
      },
      {
        key: 'seenWith',
        label: 'Seen With (Others)',
        icon: '👥',
        count: person.seenWithSightings.length,
        render: () =>
          person.seenWithSightings.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'sighting')}
            >
              <RecordCard
                title={`${r.personName} was here`}
                subtitle={r.note ?? ''}
                timestamp={r.timestamp}
                location={r.location}
              />
            </button>
          )),
      },
      {
        key: 'authoredNotes',
        label: 'Authored Notes',
        icon: '📝',
        count: person.authoredNotes.length,
        render: () =>
          person.authoredNotes.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'personalNote')}
            >
              <RecordCard
                title="Note"
                subtitle={r.note}
                timestamp={r.timestamp}
                location={r.location}
              />
            </button>
          )),
      },
      {
        key: 'mentionedIn',
        label: 'Mentioned In Notes',
        icon: '💬',
        count: person.mentionedInNotes.length,
        render: () =>
          person.mentionedInNotes.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'personalNote')}
            >
              <RecordCard
                title={`By: ${r.authorName}`}
                subtitle={r.note}
                timestamp={r.timestamp}
                location={r.location}
              />
            </button>
          )),
      },
      {
        key: 'tips',
        label: 'Anonymous Tips',
        icon: '🕵',
        count: person.tips.length,
        render: () =>
          person.tips.map((r) => (
            <button
              type="button"
              key={r.id}
              className={styles.recordButton}
              onClick={() => onRecordClick?.(r, 'anonymousTip')}
            >
              <RecordCard
                title="Anonymous Tip"
                subtitle={r.tip}
                timestamp={r.timestamp}
                location={r.location}
                badgeLevel={r.confidence}
              />
            </button>
          )),
      },
    ];
  }, [person, onRecordClick]);

  if (!person) return null;

  /* Toplam kayıt sayısı */
  const totalRecords = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <Modal
      isOpen={!!person}
      onClose={onClose}
      title={person.name}
      subtitle={`${totalRecords} records across ${categories.filter((c) => c.count > 0).length} categories`}
    >
      {/* Kişi özet kartı */}
      <div className={styles.profileSummary}>
        <div className={styles.avatar}>
          {person.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{person.name}</span>
          <span className={styles.profileStat}>
            {totalRecords} total records
          </span>
        </div>
      </div>

      {/* Kategorize kayıtlar */}
      <div className={styles.categoryList}>
        {categories
          .filter((c) => c.count > 0)
          .map((category) => (
            <div key={category.key} className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryLabel}>{category.label}</span>
                <span className={styles.categoryCount}>{category.count}</span>
              </div>
              <div className={styles.recordList}>
                {category.render()}
              </div>
            </div>
          ))}
      </div>
    </Modal>
  );
}
