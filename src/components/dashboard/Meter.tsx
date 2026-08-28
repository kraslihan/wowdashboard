import styles from "./Meter.module.css";

interface MeterProps {
  label: string;
  value: number;
  max: number;
  valueLabel?: string;
  tone?: "accent" | "good";
}

export function Meter({ label, value, max, valueLabel, tone = "accent" }: MeterProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={styles.meter}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{valueLabel ?? `${value} / ${max}`}</span>
      </div>
      <div className={styles.track} data-tone={tone}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
