/**
 * ThreeDCard — Aceternity 3D Card Effect (CSS Modules).
 *
 * 3 bileşen: CardContainer → CardBody → CardItem.
 * Fare hareketiyle perspektif dönüşü. CardItem'lar Z-ekseninde
 * "havada süzülür" (translateZ). Context ile mouse state paylaşılır.
 *
 * Kullanım:
 *   <CardContainer>
 *     <CardBody className={styles.card}>
 *       <CardItem translateZ={50}><h2>Başlık</h2></CardItem>
 *       <CardItem translateZ={30}><p>Alt metin</p></CardItem>
 *     </CardBody>
 *   </CardContainer>
 */
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type ElementType,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import styles from './ThreeDCard.module.css';

/* ─── Context ─── */

const MouseEnterContext = createContext<
  [boolean, Dispatch<SetStateAction<boolean>>]
>([false, () => {}]);

/* ─── CardContainer ─── */

interface CardContainerProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly containerClassName?: string;
  /** Dönüş hassasiyeti — düşük = daha dramatik. Varsayılan 25. */
  readonly sensitivity?: number;
}

export function CardContainer({
  children,
  className,
  containerClassName,
  sensitivity = 25,
}: CardContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const { left, top, width, height } =
        containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / sensitivity;
      const y = (e.clientY - top - height / 2) / sensitivity;
      containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    },
    [sensitivity],
  );

  const handleMouseEnter = useCallback(() => setIsMouseEntered(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsMouseEntered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
    }
  }, []);

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div className={`${styles.container} ${containerClassName ?? ''}`}>
        <div
          ref={containerRef}
          className={`${styles.inner} ${className ?? ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

/* ─── CardBody ─── */

interface CardBodyProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
}

export function CardBody({ children, className, onClick }: CardBodyProps) {
  return (
    <div className={`${styles.body} ${className ?? ''}`} onClick={onClick}>
      {children}
    </div>
  );
}

/* ─── CardItem ─── */

interface CardItemProps {
  readonly as?: ElementType;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly translateX?: number | string;
  readonly translateY?: number | string;
  readonly translateZ?: number | string;
  readonly rotateX?: number | string;
  readonly rotateY?: number | string;
  readonly rotateZ?: number | string;
  readonly onClick?: () => void;
  readonly style?: CSSProperties;
}

export function CardItem({
  as: Component = 'div',
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX: rx = 0,
  rotateY: ry = 0,
  rotateZ: rz = 0,
  ...rest
}: CardItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useContext(MouseEnterContext);

  useEffect(() => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = [
        `translateX(${translateX}px)`,
        `translateY(${translateY}px)`,
        `translateZ(${translateZ}px)`,
        `rotateX(${rx}deg)`,
        `rotateY(${ry}deg)`,
        `rotateZ(${rz}deg)`,
      ].join(' ');
    } else {
      ref.current.style.transform =
        'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rx, ry, rz]);

  return (
    <Component
      ref={ref}
      className={`${styles.item} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
