export function cleanObject(obj: any): any {

  if (Array.isArray(obj)) {
    // Return arrays as-is
    return obj;
  }

  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      let cleaned = value;

      // Recursively clean only nested objects (not arrays)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        cleaned = cleanObject(value);
      }

      const isEmptyObject =
        typeof cleaned === 'object' &&
        cleaned !== null &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned).length === 0;

      if (
        cleaned !== null &&
        cleaned !== '' &&
        cleaned !== undefined &&
        (!isEmptyObject || Array.isArray(cleaned)) // keep empty arrays
      ) {
        acc[key] = cleaned;
      }

      return acc;
    }, {} as any);
  }

  // Return primitive values as-is
  return obj;
}
