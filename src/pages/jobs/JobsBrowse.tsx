import { useEffect, useState } from 'react';
import { listOpenJobs } from '../../lib/api';
import type { JobWithClient } from '../../types/database';
import { JobCard } from './JobCard';
import { Input } from '../../components/ui/Field';

export function JobsBrowse() {
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      listOpenJobs({ search: search || undefined })
        .then(setJobs)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div>
      <p className="label-tag mb-2">Open jobs</p>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <h1 className="font-display text-2xl font-semibold">Browse technical work</h1>
        <div className="w-full sm:w-72">
          <Input placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading && <p className="text-line-500 font-mono text-sm">Loading…</p>}

      {!loading && jobs.length === 0 && (
        <p className="text-line-500 font-mono text-sm">No open jobs match yet — check back soon.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
