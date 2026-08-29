import Link from "next/link";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
  href: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
}

export function Tabs({ tabs, activeId }: TabsProps) {
  return (
    <div role="tablist" aria-label="Character dashboard sections" className={styles.tablist}>
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            data-active={selected}
            className={styles.tab}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
