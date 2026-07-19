import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createJob, listSkills } from '../../lib/api';
import type { Skill } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { FieldGroup, Input, Label, Textarea } from '../../components/ui/Field';

const categories = [
  'CAD & Design',
  'Programming',
  'Data & Analysis',
  'Materials Engineering',
  'Writing & Documentation',
  'Electronics',
  'Robotics',
];

export function PostJob() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSkills().then(setSkills);
  }, []);

  function toggleSkill(id: string) {
    setSelectedSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      const job = await createJob({
        client_id: session.user.id,
        title,
        description,
        category,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        deadline: deadline || null,
        required_skills: selectedSkills,
      });
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post job.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="label-tag mb-2">New listing</p>
      <h1 className="font-display text-2xl font-semibold mb-8">Post a job</h1>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" required value={description} onChange={(e) => setDescription(e.target.value)} />
        </FieldGroup>

        <FieldGroup>
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                  category === c ? 'border-signal-500 text-signal-400 bg-signal-950' : 'border-blueprint-600 text-line-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup>
            <Label htmlFor="budgetMin">Budget min (BDT)</Label>
            <Input id="budgetMin" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="budgetMax">Budget max (BDT)</Label>
            <Input id="budgetMax" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </FieldGroup>
        </div>

        <FieldGroup>
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </FieldGroup>

        <FieldGroup>
          <Label>Required skills</Label>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => toggleSkill(s.id)}
                className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                  selectedSkills.includes(s.id)
                    ? 'border-signal-500 text-signal-400 bg-signal-950'
                    : 'border-blueprint-600 text-line-500'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </FieldGroup>

        {error && <p className="text-danger-500 text-sm mb-4">{error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post job'}
        </Button>
      </form>
    </div>
  );
}
