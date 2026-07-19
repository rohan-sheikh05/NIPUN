import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listMyApplications, listMyContracts, listMyJobs } from '../lib/api';
import { Card, TitleBlockMeta } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { session, profile } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !profile) return;
    (async () => {
      setLoading(true);
      const c = await listMyContracts(session.user.id);
      setContracts(c);
      if (profile.role === 'student') {
        const apps = await listMyApplications(session.user.id);
        setApplications(apps);
      } else if (profile.role === 'client') {
        const j = await listMyJobs(session.user.id);
        setJobs(j);
      }
      setLoading(false);
    })();
  }, [session, profile]);

  if (!profile) return null;

  return (
    <div>
      <p className="label-tag mb-2">{profile.role === 'student' ? 'Student dashboard' : 'Client dashboard'}</p>
      <h1 className="font-display text-2xl font-semibold mb-8">Welcome back, {profile.full_name.split(' ')[0]}</h1>

      {loading && <p className="text-line-500 font-mono text-sm">Loading…</p>}

      {profile.role === 'client' && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="label-tag">Your posted jobs</p>
            <Link to="/post-job">
              <Button size="sm">Post a job</Button>
            </Link>
          </div>
          {!loading && jobs.length === 0 && <p className="text-line-500 font-mono text-sm">No jobs posted yet.</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <Card className="hover:border-signal-500 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{job.title}</p>
                    <StatusBadge status={job.status} />
                  </div>
                  <TitleBlockMeta fields={[{ label: 'Category', value: job.category }]} />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {profile.role === 'student' && (
        <section className="mb-10">
          <p className="label-tag mb-4">Your applications</p>
          {!loading && applications.length === 0 && (
            <p className="text-line-500 font-mono text-sm">
              No applications yet — <Link to="/jobs" className="text-signal-400 hover:underline">browse open jobs</Link>.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {applications.map((app) => (
              <Link key={app.id} to={`/jobs/${app.job_id}`}>
                <Card className="hover:border-signal-500 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{app.jobs?.title}</p>
                    <StatusBadge status={app.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="label-tag mb-4">Contracts</p>
        {!loading && contracts.length === 0 && (
          <p className="text-line-500 font-mono text-sm">No active contracts yet.</p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          {contracts.map((c) => (
            <Link key={c.id} to={`/contracts/${c.id}`}>
              <Card className="hover:border-signal-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{c.jobs?.title}</p>
                  <StatusBadge status={c.escrow_status} />
                </div>
                <TitleBlockMeta fields={[{ label: 'Amount', value: `৳${c.agreed_amount}` }]} />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
