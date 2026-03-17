import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_OCR_PER_DAY = 30; // 일일 30회 제한
const STORAGE_KEY_DATE = '@ocr_usage_date';
const STORAGE_KEY_COUNT = '@ocr_usage_count';

export function useOcrLimit() {
  const [usageCount, setUsageCount] = useState(0);
  const [canUseOcr, setCanUseOcr] = useState(true);

  useEffect(() => {
    checkUsage();
  }, []);

  const checkUsage = async (): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);
      const storedCount = await AsyncStorage.getItem(STORAGE_KEY_COUNT);

      if (storedDate === today) {
        const count = storedCount ? parseInt(storedCount, 10) : 0;
        setUsageCount(count);
        const allowed = count < MAX_OCR_PER_DAY;
        setCanUseOcr(allowed);
        return allowed;
      } else {
        // Reset for a new day
        await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEY_COUNT, '0');
        setUsageCount(0);
        setCanUseOcr(true);
        return true;
      }
    } catch (e) {
      console.error('Failed to check OCR usage limit', e);
      // Fallback to allow if storage fails
      setCanUseOcr(true);
      return true;
    }
  };

  const incrementUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);
      
      let newCount = usageCount + 1;

      if (storedDate !== today) {
         await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
         newCount = 1;
      }

      await AsyncStorage.setItem(STORAGE_KEY_COUNT, newCount.toString());
      setUsageCount(newCount);
      setCanUseOcr(newCount < MAX_OCR_PER_DAY);
    } catch (e) {
       console.error('Failed to increment OCR usage', e);
    }
  };

  return {
    canUseOcr,
    usageCount,
    maxLimit: MAX_OCR_PER_DAY,
    incrementUsage,
    checkUsage,
  };
}
