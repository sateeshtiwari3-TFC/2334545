export const compressImage = (
  input: string | File | Blob | any,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve) => {
    if (!input) {
      resolve('');
      return;
    }

    const processDataUrl = (dataUrl: string) => {
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        resolve(typeof dataUrl === 'string' ? dataUrl : '');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Produce JPEG compressed string
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    };

    // If input is File or Blob
    if (typeof input !== 'string' && (input instanceof Blob || (input && typeof input === 'object' && 'slice' in input))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result;
        if (typeof res === 'string') {
          processDataUrl(res);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
      return;
    }

    // If input is already string
    if (typeof input === 'string') {
      processDataUrl(input);
      return;
    }

    resolve(String(input || ''));
  });
};

export const generateUniqueProjectId = (existingProjects: { id: string }[]): string => {
  let maxNum = 0;
  if (Array.isArray(existingProjects)) {
    existingProjects.forEach(p => {
      if (p && p.id) {
        const match = p.id.match(/PRJ-2026-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  }
  let nextNum = maxNum + 1;
  let candidateId = `PRJ-2026-${String(nextNum).padStart(3, '0')}`;

  while (existingProjects && existingProjects.some(p => p && p.id === candidateId)) {
    nextNum += 1;
    candidateId = `PRJ-2026-${String(nextNum).padStart(3, '0')}`;
  }

  return candidateId;
};
