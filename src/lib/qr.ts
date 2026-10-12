export function extractCredentialsFromQR(
  text: string,
): { username: string; password: string; name?: string } | null {
  if (typeof text !== "string" || text.length > 4096) return null;
  let username: unknown, password: unknown, name: unknown;
  try {
    const d = JSON.parse(text);
    username = d.username;
    password = d.password;
    name = d.name;
  } catch {
    const u = text.match(/(?:^|\n)\s*(?:username|user)\s*:\s*([^\r\n]+)/i),
      p = text.match(/(?:^|\n)\s*(?:password|pass)\s*:\s*([^\r\n]+)/i);
    if (u && p) {
      username = u[1].trim();
      password = p[1].trim();
    } else {
      const parts = text.split("|");
      if (parts.length === 2) {
        [username, password] = parts;
      }
    }
  }
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password ||
    username.length > 100 ||
    password.length > 128
  )
    return null;
  return { username, password, ...(typeof name === "string" ? { name } : {}) };
}
