import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  applyToJob,
  createContract,
  decideApplication,
  getJob,
  getMyApplicationForJob,
  listApplicationsForJob,
} from '../../lib/api';
import type { Application, JobWithClient } from '../../types/database';
import { Card, TitleBlockMeta } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FieldGroup, Input, Label, Textarea } from '../../components/ui/Field';

interface ApplicationRow extends Application {
  profiles: { full_name: string; university: string | null } | null;
  student_profiles: { bio: string | null; hourly_rate: number | null; rating_avg: number } | null;
}

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobWithClient | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwningClient = profile?.role === 'client' && job?.client_id === session?.user.id;
  const isStudent = profile?.role === 'student';

  async function loadAll() {
    if (!id) return;
    setLoading(true);
    const j = await getJob(id);
    setJob(j);

    if (j && profile?.role === 'client' && j.client_id === session?.user.id) {
      const apps = await listApplicationsForJob(id);
      setApplications(apps as unknown as ApplicationRow[]);
    }
    if (j && profile?.role === 'student' && session) {
      const mine = await getMyApplicationForJob(id, session.user.id);
      setMyApplication(mine);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !id) return;
    setSubmitting(true);
    setError(null);
    try {
      await applyToJob({
        job_id: id,
        student_id: session.user.id,
        cover_letter: coverLetter,
        proposed_rate: proposedRate ? Number(proposedRate) : null,
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAccept(app: ApplicationRow) {
    if (!job || !session) return;
    await decideApplication(app.id, 'accepted');
    const contract = await createContract({
      job_id: job.id,
      application_id: app.id,
      student_id: app.student_id,
      client_id: session.user.id,
      agreed_amount: app.proposed_rate ?? job.budget_max ?? job.budget_min ?? 0,
    });
    navigate(`/contracts/${contract.id}`);
  }

  async function handleReject(app: ApplicationRow) {
    await decideApplication(app.id, 'rejected');
    await loadAll();
  }

  if (loading) return <p className="text-line-500 font-mono text-sm">Loading…</p>;
  if (!job) return <p className="text-line-500 font-mono text-sm">Job not found.</p>;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-3">
          <p className="label-tag">{job.category}</p>
          <StatusBadge status={job.status} />
        </div>
        <h1 className="font-display text-3xl font-semibold mb-4">{job.title}</h1>
        <p className="text-line-300 leading-relaxed whitespace-pre-line">{job.description}</p>

        <Card className="mt-8">
          <TitleBlockMeta
            fields={[
              { label: 'Client', value: job.client_profiles?.org_name ?? 'Unknown' },
              { label: 'Org type', value: job.client_profiles?.org_type ?? '—' },
              {
                label: 'Budget',
                value: job.budget_min && job.budget_max ? `৳${job.budget_min}–${job.budget_max}` : 'Negotiable',
              },
              { label: 'Deadline', value: job.deadline ?? 'Flexible' },
            ]}
          />
        </Card>

        {isOwningClient && (
          <div className="mt-10">
            <p className="label-tag mb-4">Applications ({applications.length})</p>
            <div className="space-y-3">
              {applications.length === 0 && (
                <p className="text-line-500 font-mono text-sm">No applications yet.</p>
              )}
              {applications.map((app) => (
                <Card key={app.id} cropmark={false} className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">{app.profiles?.full_name ?? 'Student'}</p>
                    <p className="text-line-500 text-sm">{app.profiles?.university}</p>
                    {app.cover_letter && <p className="text-line-300 text-sm mt-2">{app.cover_letter}</p>}
                    <div className="mt-2 flex gap-3 items-center">
                      {app.proposed_rate && <Badge>৳{app.proposed_rate}</Badge>}
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAccept(app)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleReject(app)}>
                        Reject
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        {isStudent && job.status === 'open' && (
          <Card>
            {myApplication ? (
              <div>
                <p className="label-tag mb-2">Your application</p>
                <StatusBadge status={myApplication.status} />
                <p className="text-line-500 text-sm mt-3">
                  You applied on {new Date(myApplication.created_at).toLocaleDateString()}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply}>
                <p className="label-tag mb-4">Apply to this job</p>
                <FieldGroup>
                  <Label htmlFor="coverLetter">Cover letter</Label>
                  <Textarea
                    id="coverLetter"
                    required
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Why you're a good fit, and how you'd approach it."
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="rate">Proposed rate (BDT)</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                  />
                </FieldGroup>
                {error && <p className="text-danger-500 text-sm mb-3">{error}</p>}
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Submitting…' : 'Submit application'}
                </Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
