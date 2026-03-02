/**
 * Utility to compress an image file on the client side using Canvas.
 * This helps avoid 413 Request Entity Too Large errors and speeds up uploads.
 */
export async function compressImage(file: File, options: { maxSizeMB: number; maxWidth?: number }): Promise<File> {
    const { maxSizeMB, maxWidth = 1920 } = options;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size <= maxSizeBytes) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if necessary
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Failed to get canvas context'));
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Iteratively reduce quality until under maxSize or quality limit
                let quality = 0.9;
                const tryCompress = (q: number) => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                return reject(new Error('Canvas toBlob failed'));
                            }
                            if (blob.size <= maxSizeBytes || q <= 0.1) {
                                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                            } else {
                                tryCompress(q - 0.1);
                            }
                        },
                        'image/jpeg',
                        q
                    );
                };

                tryCompress(quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
