import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { subscribeSaving, isSavingDatabase, notifySavingState } from '../db/sqlite';

interface SavingContextType {
  isSaving: boolean;
  savingMessage: string;
  recentlySaved: boolean;
  startSaving: (message?: string) => () => void;
  withSaving: <T>(action: () => Promise<T>, message?: string) => Promise<T>;
  setSaving: (saving: boolean, message?: string) => void;
}

const SavingContext = createContext<SavingContextType | null>(null);

export const SavingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState<boolean>(() => isSavingDatabase());
  const [savingMessage, setSavingMessage] = useState<string>('Saving changes to database...');
  const [recentlySaved, setRecentlySaved] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const handleSavingUpdate = (saving: boolean, msg?: string) => {
      if (timer) clearTimeout(timer);
      setIsSaving(saving);
      if (saving) {
        setSavingMessage(msg || 'Saving changes to database...');
        setRecentlySaved(false);
      } else {
        setRecentlySaved(true);
        timer = setTimeout(() => {
          setRecentlySaved(false);
        }, 2500);
      }
    };

    const unsubscribe = subscribeSaving((saving, msg) => {
      handleSavingUpdate(saving, msg);
    });

    const onCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ isSaving: boolean; message?: string }>;
      const { isSaving: saving, message } = customEvent.detail || {};
      handleSavingUpdate(Boolean(saving), message);
    };

    window.addEventListener('djital:saving-state', onCustomEvent);
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      window.removeEventListener('djital:saving-state', onCustomEvent);
    };
  }, []);

  const setSaving = useCallback((saving: boolean, message?: string) => {
    notifySavingState(saving, message);
  }, []);

  const startSaving = useCallback((message?: string) => {
    notifySavingState(true, message || 'Saving changes to database...');
    let finished = false;
    return () => {
      if (!finished) {
        finished = true;
        notifySavingState(false);
      }
    };
  }, []);

  const withSaving = useCallback(async <T,>(action: () => Promise<T>, message?: string): Promise<T> => {
    notifySavingState(true, message || 'Saving changes to database...');
    try {
      return await action();
    } finally {
      notifySavingState(false);
    }
  }, []);

  return (
    <SavingContext.Provider
      value={{
        isSaving,
        savingMessage,
        recentlySaved,
        startSaving,
        withSaving,
        setSaving,
      }}
    >
      {children}
    </SavingContext.Provider>
  );
};

export const useSaving = () => {
  const ctx = useContext(SavingContext);
  if (!ctx) {
    return {
      isSaving: false,
      savingMessage: 'Saving...',
      recentlySaved: false,
      startSaving: () => () => {},
      withSaving: async <T,>(action: () => Promise<T>) => action(),
      setSaving: () => {},
    };
  }
  return ctx;
};
