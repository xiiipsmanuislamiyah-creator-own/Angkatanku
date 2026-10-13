export function scheduleIssue(days: any[]): string | null {
  const names = new Set<string>();
  for (const day of days) {
    if (names.has(day.day))
      return "Hari yang sama tidak boleh ditulis dua kali.";
    names.add(day.day);
    const ranges: { start: number; end: number }[] = [];
    for (const item of day.subjects) {
      const m =
        typeof item.time === "string"
          ? item.time.match(
              /^\s*(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})\s*$/,
            )
          : null;
      // Preserve legacy start-only entries without inventing a lesson duration.
      if (!m && typeof item.time === 'string' && /^([01]?\d|2[0-3])[.:][0-5]\d$/.test(item.time.trim())) {
        const [hour, minute] = item.time.split(/[.:]/).map(Number);
        const start = hour * 60 + minute;
        if (ranges.some(r => start >= r.start && start < r.end))
          return 'Ada waktu mulai yang bertabrakan pada hari ' + day.day + '.';
        ranges.push({start, end: start + 1});
        continue;
      }
      if (!m || +m[1] > 23 || +m[3] > 23 || +m[2] > 59 || +m[4] > 59)
        return "Gunakan rentang waktu yang valid, misalnya 07.00 - 08.00.";
      const start = +m[1] * 60 + +m[2],
        end = +m[3] * 60 + +m[4];
      if (end <= start) return "Waktu selesai harus setelah waktu mulai.";
      if (ranges.some((r) => start < r.end && end > r.start))
        return "Ada jadwal yang bertabrakan pada hari " + day.day + ".";
      ranges.push({ start, end });
    }
  }
  return null;
}
