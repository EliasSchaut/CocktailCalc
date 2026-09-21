import { isTauri } from './local/storage';

/** Offers a text file to the user: native save dialog in the Tauri app, download link in the browser. */
export async function saveTextFile(
  filename: string,
  text: string,
  mime = 'application/json',
) {
  if (__TAURI_BUILD__ && isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const ext = filename.split('.').pop() ?? 'txt';
    const path = await save({
      defaultPath: filename,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });
    if (path) await writeTextFile(path, text);
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
