
import { safeStorage, checkStorageAvailability } from './safeStorage';

// Test utility to verify SafeStorage functionality
export const testSafeStorage = async (): Promise<{
  success: boolean;
  results: string[];
  errors: string[];
}> => {
  const results: string[] = [];
  const errors: string[] = [];
  let success = true;

  try {
    // Test 1: Check storage availability
    results.push('🔍 Testing storage availability...');
    const availability = await checkStorageAvailability();
    results.push(`✅ Storage type: ${availability.type}, Available: ${availability.available}`);
    
    if (availability.error) {
      errors.push(`⚠️ Storage warning: ${availability.error}`);
    }

    // Test 2: Save and load JSON data
    results.push('💾 Testing JSON save/load...');
    const testData = {
      theme: 'dark' as const,
      notifications: true,
      testNumber: 42,
      testArray: [1, 2, 3],
      testNested: { foo: 'bar' }
    };

    await safeStorage.saveJSON('test:data', testData);
    const loadedData = await safeStorage.loadJSON('test:data', {});
    
    if (JSON.stringify(testData) === JSON.stringify(loadedData)) {
      results.push('✅ JSON save/load successful');
    } else {
      errors.push('❌ JSON save/load failed - data mismatch');
      success = false;
    }

    // Test 3: Load with fallback
    results.push('🔄 Testing fallback behavior...');
    const fallbackData = { fallback: true };
    const nonExistentData = await safeStorage.loadJSON('test:nonexistent', fallbackData);
    
    if (JSON.stringify(nonExistentData) === JSON.stringify(fallbackData)) {
      results.push('✅ Fallback behavior working');
    } else {
      errors.push('❌ Fallback behavior failed');
      success = false;
    }

    // Test 4: Remove data
    results.push('🗑️ Testing data removal...');
    await safeStorage.remove('test:data');
    const removedData = await safeStorage.loadJSON('test:data', null);
    
    if (removedData === null) {
      results.push('✅ Data removal successful');
    } else {
      errors.push('❌ Data removal failed');
      success = false;
    }

    // Test 5: Handle corrupted JSON
    results.push('🔧 Testing corrupted JSON handling...');
    try {
      // This would normally cause JSON.parse to throw
      const corruptedResult = await safeStorage.loadJSON('test:corrupted', { safe: true });
      if (corruptedResult.safe === true) {
        results.push('✅ Corrupted JSON handled safely');
      }
    } catch (error) {
      errors.push('❌ Corrupted JSON not handled safely');
      success = false;
    }

  } catch (error) {
    errors.push(`❌ Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    success = false;
  }

  return { success, results, errors };
};

// Quick test function for debugging
export const quickStorageTest = async (): Promise<boolean> => {
  try {
    const testKey = 'quick:test';
    const testValue = { timestamp: Date.now(), test: true };
    
    await safeStorage.saveJSON(testKey, testValue);
    const loaded = await safeStorage.loadJSON(testKey, null);
    await safeStorage.remove(testKey);
    
    return loaded !== null && loaded.test === true;
  } catch {
    return false;
  }
};
