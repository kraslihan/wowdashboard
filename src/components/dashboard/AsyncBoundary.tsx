import type { ReactNode } from "react";
import styles from "./AsyncBoundary.module.css";

interface AsyncBoundaryProps<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  children: (data: T) => ReactNode;
}

export function AsyncBoundary<T>({ loading, error, data, children }: AsyncBoundaryProps<T>) {
  if (loading) {
    return <div className={styles.status}>Loading…</div>;
  }
  if (error) {
    return <div className={styles.error}>Failed to load: {error}</div>;
  }
  if (!data) {
    return null;
  }
  return <>{children(data)}</>;
}
