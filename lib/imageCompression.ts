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

                // Iteratively reduce quality, then dimensions, until under max size.
                const tryCompress = (q: number, scale: number) => {
                    const outWidth = Math.max(320, Math.floor(width * scale));
                    const outHeight = Math.max(240, Math.floor(height * scale));
                    canvas.width = outWidth;
                    canvas.height = outHeight;
                    ctx.drawImage(img, 0, 0, outWidth, outHeight);
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                return reject(new Error('Canvas toBlob failed'));
                            }
                            if (blob.size <= maxSizeBytes) {
                                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                                return;
                            }
                            if (q > 0.5) {
                                tryCompress(q - 0.1, scale);
                                return;
                            }
                            if (scale > 0.5) {
                                tryCompress(0.85, scale - 0.1);
                            } else {
                                // Return best-effort compression result even if still above target.
                                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                            }
                        },
                        'image/jpeg',
                        q
                    );
                };

                tryCompress(0.9, 1);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
