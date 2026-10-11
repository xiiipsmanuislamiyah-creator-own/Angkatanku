export interface ParsedMetadataItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  type: 'image' | 'video';
  date: string;
  raw?: any;
}

/**
 * Parses JSON metadata string from user/tools into clean media items.
 * Supports:
 * - Single JSON object
 * - JSON Array
 * - Multiple comma-separated or whitespace-separated JSON objects
 * - Objects wrapped in { data: [...] } or { assets: [...] } or { files: [...] }
 */
export function parseMetadataInput(rawText: string): ParsedMetadataItem[] {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.trim();
  
  let parsedJson: any = null;

  // 1. Direct JSON parse
  try {
    parsedJson = JSON.parse(text);
  } catch {
    // 2. Try wrapping in array if text looks like multiple comma/space separated objects
    try {
      const wrapped = text.startsWith('[') ? text : `[${text.replace(/}\s*,\s*{/g, '},{').replace(/}\s+{/g, '},{')}]`;
      parsedJson = JSON.parse(wrapped);
    } catch {
      // 3. Fallback: regex search for all { ... } blocks
      const matches = text.match(/\{[\s\S]*?\}(?=\s*(?:\{|\]|,|\s*$))/g);
      if (matches && matches.length > 0) {
        const list: any[] = [];
        for (const m of matches) {
          try {
            list.push(JSON.parse(m));
          } catch {
            // ignore malformed fragments
          }
        }
        if (list.length > 0) parsedJson = list;
      }
    }
  }

  if (!parsedJson) return [];

  // Normalize to array
  let rawList: any[] = [];
  if (Array.isArray(parsedJson)) {
    rawList = parsedJson;
  } else if (typeof parsedJson === 'object' && parsedJson !== null) {
    if (Array.isArray(parsedJson.data)) rawList = parsedJson.data;
    else if (Array.isArray(parsedJson.assets)) rawList = parsedJson.assets;
    else if (Array.isArray(parsedJson.files)) rawList = parsedJson.files;
    else if (Array.isArray(parsedJson.items)) rawList = parsedJson.items;
    else rawList = [parsedJson];
  }

  const results: ParsedMetadataItem[] = [];
  const seenUrls = new Set<string>();

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') continue;

    // Pick best available URL
    const url = item.url || item.secure_url || item.imageUrl || item.link || item.fileUrl || item.thumbnailUrl;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) continue;

    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Clean name / title: strip file extension
    let name = item.name || item.title || item.publicId?.split('/').pop() || `Foto Memori #${i + 1}`;
    if (typeof name === 'string') {
      name = name.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[-_]/g, ' ').trim();
      if (!name) name = `Foto Memori #${i + 1}`;
    }

    // Determine type (image or video)
    const isVideo = 
      item.type === 'video' || 
      item.mimeType?.startsWith('video/') || 
      /\.(mp4|webm|mov|mkv)(\?|$)/i.test(url) ||
      url.includes('/video/upload/');

    // Determine date (YYYY-MM-DD)
    let date = new Date().toISOString().split('T')[0];
    if (item.uploadedAt && typeof item.uploadedAt === 'string') {
      const parsed = item.uploadedAt.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) date = parsed;
    } else if (item.date && typeof item.date === 'string') {
      const parsed = item.date.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) date = parsed;
    }

    results.push({
      id: item.id || `meta-${Date.now()}-${i}`,
      name,
      url: url.trim(),
      thumbnailUrl: item.thumbnailUrl || url.trim(),
      type: isVideo ? 'video' : 'image',
      date,
      raw: item
    });
  }

  return results;
}
