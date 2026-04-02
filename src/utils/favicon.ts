export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch (error) {
    // Fallback if the URL is invalid
    return '/default-tool-icon.svg'; 
  }
}