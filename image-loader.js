export default function imageLoader({ src, width, quality }) {
  // If the image is from Supabase, don't modify the URL
  if (src.includes('supabase.co')) {
    return src;
  }
  // For other images, add width and quality parameters
  return `${src}?w=${width}&q=${quality || 75}`;
} 