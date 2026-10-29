export function getFaviconUrl(url: string): string {
  try { return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}` }
  catch { return '' }
}
