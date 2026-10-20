import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SavingContextType {
  isSaving: boolean;
  recentlySaved: boolean;
  savingMessage?: string;
  withSaving: <T>(action: () => Promise<T>, message?: string) => Promise<T>;
  startSaving: (message?: string) => void;
  stopSaving: () => void;
}

const SavingContext = createContext<SavingContextType | undefined>(undefined);

export const SavingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [savingMessage, setSavingMessage] = useState<string | undefined>(undefined);

  const startSaving = useCallback((message = 'Saving changes to database...') => {
    setRecentlySaved(false);
    setIsSaving(true);
    setSavingMessage(message);
  }, []);

  const stopSaving = useCallback(() => {
    setIsSaving(false);
    setSavingMessage(undefined);
  }, []);

  useEffect(() => {
    if (!recentlySaved) return;
    const timeout = window.setTimeout(() => setRecentlySaved(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [recentlySaved]);

  const withSaving = useCallback(async <T,>(action: () => Promise<T>, message = 'Saving changes to database...'): Promise<T> => {
    startSaving(message);
    let succeeded = false;
    try {
      const result = await action();
      succeeded = true;
      return result;
    } finally {
      stopSaving();
      if (succeeded) setRecentlySaved(true);
    }
  }, [startSaving, stopSaving]);

  return (
    <SavingContext.Provider value={{ isSaving, recentlySaved, savingMessage, withSaving, startSaving, stopSaving }}>
      {children}
    </SavingContext.Provider>
  );
};

export const useSaving = (): SavingContextType => {
  const context = useContext(SavingContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      isSaving: false,
      recentlySaved: false,
      savingMessage: undefined,
      withSaving: async (action) => action(),
      startSaving: () => {},
      stopSaving: () => {},
    };
  }
  return context;
};
