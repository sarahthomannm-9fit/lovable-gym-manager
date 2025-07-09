
import { useEffect, useRef } from 'react';

export function useLocalStorage<T>(
  key: string,
  data: T,
  setData: (data: T) => void
) {
  const isInitialized = useRef(false);

  // Load from localStorage only once on mount
  useEffect(() => {
    if (!isInitialized.current) {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setData(parsedData);
        } catch (error) {
          console.error(`Error parsing ${key} from localStorage:`, error);
        }
      }
      isInitialized.current = true;
    }
  }, [key, setData]);

  // Save to localStorage when data changes (but not during initialization)
  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }, [key, data]);
}
