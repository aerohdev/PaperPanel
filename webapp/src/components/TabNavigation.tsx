import { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 border-b border-light-border dark:border-dark-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === tab.id
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
