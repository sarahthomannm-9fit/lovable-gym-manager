
import { useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  data: T,
  setData: (data: T) => void
) {
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);

  // Load from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } catch (error) {
        console.error(`Error parsing ${key} from localStorage:`, error);
      }
    }
  }, [key, setData]);
}
