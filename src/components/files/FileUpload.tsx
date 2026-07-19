import { useRef, useState } from 'react';
import { uploadContractFile } from '../../lib/api';
import { Button } from '../ui/Button';

export function FileUpload({
  contractId,
  uploaderId,
  onUploaded,
}: {
  contractId: string;
  uploaderId: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`${file.name} is over the 50MB limit.`);
        }
        await uploadContractFile(contractId, uploaderId, file);
      }
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Upload file'}
      </Button>
      <p className="label-tag mt-2">STEP, IGES, BREP, STL, OBJ, glTF preview supported · 50MB max</p>
      {error && <p className="text-danger-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
