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


export function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return 'application/octet-stream'; // fallback
  }
}


export function base64ToFile(base64: string, fileName: string, mimeType: string): File {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new File([byteArray], fileName, { type: mimeType });
}
