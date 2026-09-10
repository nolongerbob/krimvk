/** Human-readable name, separate from the unique storage directory. */
export function cleanApplicationFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || "";
  const extension = base.match(/\.([a-zA-Z0-9]{1,10})$/)?.[1].toLowerCase();
  const stem = (extension ? base.slice(0, -(extension.length + 1)) : base)
    .normalize("NFC")
    .replace(new RegExp("[^\\p{L}\\p{N} ]", "gu"), " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "Документ";
  return extension ? `${stem}.${extension}` : stem;
}

export function applicationFileLabel(url: string, index: number): string {
  let name = url.split("?")[0].split("/").pop() || "";
  try { name = decodeURIComponent(name); } catch { /* Legacy malformed URL. */ }
  name = name.replace(/^user_[^_]+_\d+_/, "");
  const clean = cleanApplicationFileName(name);
  return clean.replace(/^Документ(?=\.|$)/, `Документ ${index + 1}`);
}
