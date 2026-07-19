import { lazy, Suspense, useState } from 'react';
import { getSignedFileUrl } from '../../lib/api';
import { isCadViewable } from '../../lib/cadFormats';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// three.js only loads once someone actually opens a preview.
const CADViewer = lazy(() => import('../cad/CADViewer').then((m) => ({ default: m.CADViewer })));

interface FileRow {
  id: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  version: number;
  profiles?: { full_name: string } | null;
}

function displayName(path: string) {
  // stored as `${contractId}/${uuid}-${originalName}` — strip both prefixes
  const afterSlash = path.split('/').pop() ?? path;
  const dashIndex = afterSlash.indexOf('-');
  return dashIndex >= 0 ? afterSlash.slice(dashIndex + 1) : afterSlash;
}

function FileRow({ file }: { file: FileRow }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const name = displayName(file.file_url);
  const viewable = isCadViewable(name);

  async function togglePreview() {
    if (previewUrl) {
      setPreviewUrl(null);
      return;
    }
    setLoadingUrl(true);
    try {
      const url = await getSignedFileUrl(file.file_url);
      setPreviewUrl(url);
    } finally {
      setLoadingUrl(false);
    }
  }

  async function handleDownload() {
    const url = await getSignedFileUrl(file.file_url);
    window.open(url, '_blank');
  }

  return (
    <Card cropmark={false}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-sm text-line-100">{name}</p>
          <p className="label-tag mt-1">
            {file.profiles?.full_name ?? 'Unknown'} · {new Date(file.uploaded_at).toLocaleString()} · rev.{' '}
            {String(file.version).padStart(2, '0')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{file.file_type}</Badge>
          {viewable && (
            <Button size="sm" variant="secondary" onClick={togglePreview} disabled={loadingUrl}>
              {previewUrl ? 'Hide 3D' : loadingUrl ? 'Loading…' : 'View in 3D'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleDownload}>
            Download
          </Button>
        </div>
      </div>

      {previewUrl && (
        <div className="mt-4">
          <Suspense
            fallback={
              <div className="h-[360px] flex items-center justify-center border border-blueprint-700 rounded-sm">
                <p className="font-mono text-xs text-line-500">Loading viewer…</p>
              </div>
            }
          >
            <CADViewer fileUrl={previewUrl} fileName={name} />
          </Suspense>
        </div>
      )}
    </Card>
  );
}

export function FileList({ files }: { files: FileRow[] }) {
  if (files.length === 0) {
    return <p className="text-line-500 font-mono text-sm">No files uploaded yet.</p>;
  }
  return (
    <div className="space-y-3">
      {files.map((f) => (
        <FileRow key={f.id} file={f} />
      ))}
    </div>
  );
}
