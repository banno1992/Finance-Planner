// Helpers for keeping browser-stored data safe: persistent storage and backup tracking.

const LAST_BACKUP_KEY = "networth_last_backup";

/** Running as an installed app (Home Screen / desktop install) rather than a browser tab. */
export function isInstalledApp(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Ask the browser not to clear this site's storage under storage pressure or inactivity.
 * Returns true if storage is persistent, false if refused, null if unsupported.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function isStoragePersistent(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}

export function recordBackup(date = new Date()): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, date.toISOString());
  } catch {
    // ignore: storage unavailable
  }
}

export function getLastBackup(): Date | null {
  try {
    const value = localStorage.getItem(LAST_BACKUP_KEY);
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/** Whole days between `from` and `now`, never negative. */
export function daysSince(from: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / 86_400_000));
}

/**
 * Save a file to the device. Installed apps on phones can't reliably trigger a download,
 * so there we open the share sheet (e.g. "Save to Files"). Returns false if the user cancelled.
 */
export async function saveFile(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: blob.type });
  const isTouch = window.matchMedia?.("(pointer: coarse)").matches;
  if (isInstalledApp() && isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return true;
    } catch (err) {
      if ((err as Error).name === "AbortError") return false;
      // fall through to a normal download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
