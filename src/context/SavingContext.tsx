import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SavingContextType {
  isSaving: boolean;
  savingMessage?: string;
  withSaving: <T>(action: () => Promise<T>, message?: string) => Promise<T>;
  startSaving: (message?: string) => void;
  stopSaving: () => void;
}

const SavingContext = createContext<SavingContextType | undefined>(undefined);

export const SavingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState<string | undefined>(undefined);

  const startSaving = useCallback((message = 'Saving changes to database...') => {
    setIsSaving(true);
    setSavingMessage(message);
  }, []);

  const stopSaving = useCallback(() => {
    setIsSaving(false);
    setSavingMessage(undefined);
  }, []);

  const withSaving = useCallback(async <T,>(action: () => Promise<T>, message = 'Saving changes to database...'): Promise<T> => {
    startSaving(message);
    try {
      const result = await action();
      return result;
    } finally {
      stopSaving();
    }
  }, [startSaving, stopSaving]);

  return (
    <SavingContext.Provider value={{ isSaving, savingMessage, withSaving, startSaving, stopSaving }}>
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
      savingMessage: undefined,
      withSaving: async (action) => action(),
      startSaving: () => {},
      stopSaving: () => {},
    };
  }
  return context;
};
