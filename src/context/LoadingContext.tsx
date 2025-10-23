import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  message?: string | undefined;
  show: (message?: string) => void;
  hide: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
};

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const show = (msg?: string) => { setMessage(msg); setIsLoading(true); };
  const hide = () => { setIsLoading(false); setMessage(undefined); };

  const value = useMemo(() => ({ isLoading, message, show, hide }), [isLoading, message]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
          <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-md text-gray-800">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="font-medium text-sm">{message || "Loading..."}</span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
