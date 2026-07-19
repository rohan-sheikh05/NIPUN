// Wraps the stock occt-import-js worker in a Promise so call sites don't
// deal with postMessage plumbing directly. The worker's own JS/WASM files
// live in public/occt/ — kept in sync with the installed occt-import-js
// version by scripts/copy-occt-assets.js, which runs on every `npm install`.
// A fresh Worker is spun up per parse and terminated afterward. The WASM
// module itself is ~7MB, so this only happens when someone actually opens
// a STEP/IGES file — never on initial page load.

export type OcctFormat = 'step' | 'iges' | 'brep';

export interface OcctMesh {
  name: string;
  color?: [number, number, number];
  attributes: {
    position: { array: number[] };
    normal?: { array: number[] };
  };
  index: { array: number[] };
}

export interface OcctResult {
  success: boolean;
  meshes: OcctMesh[];
}

export function parseCadFile(format: OcctFormat, buffer: ArrayBuffer): Promise<OcctResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/occt/occt-import-js-worker.js');

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('CAD parsing timed out — the file may be too large or malformed.'));
    }, 60_000);

    worker.onmessage = (ev: MessageEvent<OcctResult>) => {
      clearTimeout(timeout);
      worker.terminate();
      if (!ev.data?.success) {
        reject(new Error('The CAD file could not be parsed.'));
        return;
      }
      resolve(ev.data);
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(err.message || 'CAD worker crashed while parsing.'));
    };

    worker.postMessage({ format, buffer: new Uint8Array(buffer), params: null });
  });
}

export function formatFromExtension(filename: string): OcctFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'step' || ext === 'stp') return 'step';
  if (ext === 'iges' || ext === 'igs') return 'iges';
  if (ext === 'brep') return 'brep';
  return null;
}
