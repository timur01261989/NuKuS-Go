import imageCompression from 'browser-image-compression';

/**
 * Rasmni hajmini kichraytirish va optimizatsiya qilish
 * @param {File} file - Asl rasm fayli
 */
export async function compressImage(file) {
  const options = {
    maxSizeMB: 0.5,          // 500 KB dan oshmasligi kerak
    maxWidthOrHeight: 1280, // Sifatni yo'qotmaslik uchun maksimal o'lcham
    useWebWorker: true,
    fileType: 'image/jpeg'
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Kichraytirishda xato:", error);
    return file; // Xato bo'lsa asl holicha qaytaradi
  }
}