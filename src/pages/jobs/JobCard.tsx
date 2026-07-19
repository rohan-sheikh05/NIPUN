import { Link } from 'react-router-dom';
import { Card, TitleBlockMeta } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { JobWithClient } from '../../types/database';

function formatBudget(job: JobWithClient) {
  if (!job.budget_min && !job.budget_max) return 'Negotiable';
  if (job.budget_min && job.budget_max) return `৳${job.budget_min}–${job.budget_max}`;
  return `৳${job.budget_min ?? job.budget_max}`;
}

export function JobCard({ job }: { job: JobWithClient }) {
  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="hover:border-signal-500 transition-colors h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className="label-tag">{job.category}</p>
          {job.client_profiles?.verified && <Badge tone="verified">Verified client</Badge>}
        </div>
        <h3 className="font-display font-semibold text-lg mt-2 mb-2">{job.title}</h3>
        <p className="text-line-500 text-sm line-clamp-3 flex-1">{job.description}</p>
        <TitleBlockMeta
          fields={[
            { label: 'Client', value: job.client_profiles?.org_name ?? 'Unknown' },
            { label: 'Budget', value: formatBudget(job) },
            { label: 'Posted', value: new Date(job.created_at).toLocaleDateString() },
          ]}
        />
      </Card>
    </Link>
  );
}
