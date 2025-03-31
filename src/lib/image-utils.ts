
/**
 * Extracts the dominant color from an image
 * @param imageUrl URL of the image to extract color from
 * @returns Promise that resolves to the dominant color in hex format
 */
export const extractDominantColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        resolve("#000000"); // Fallback color
        return;
      }
      
      // Make canvas same size as image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      // Process pixels to find dominant color
      const colorCounts: Record<string, number> = {};
      const sampleSize = 10; // Sample every Nth pixel for performance
      
      for (let i = 0; i < imageData.length; i += 4 * sampleSize) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        
        // Skip transparent pixels
        if (imageData[i + 3] < 128) continue;
        
        // Create a simple color key
        const colorKey = `${Math.floor(r/10)},${Math.floor(g/10)},${Math.floor(b/10)}`;
        
        if (!colorCounts[colorKey]) {
          colorCounts[colorKey] = 0;
        }
        colorCounts[colorKey]++;
      }
      
      // Find the most common color
      let maxCount = 0;
      let dominantColorKey = "0,0,0";
      
      for (const colorKey in colorCounts) {
        if (colorCounts[colorKey] > maxCount) {
          maxCount = colorCounts[colorKey];
          dominantColorKey = colorKey;
        }
      }
      
      // Convert back to RGB
      const [r, g, b] = dominantColorKey.split(",").map(n => parseInt(n) * 10);
      
      // Convert to hex
      const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + [r, g, b]
          .map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("");
      };
      
      // Add a slight transparency to the color to make it more subtle
      resolve(rgbToHex(r, g, b));
    };
    
    img.onerror = () => {
      resolve("#000000"); // Fallback color
    };
    
    img.src = imageUrl;
  });
};
