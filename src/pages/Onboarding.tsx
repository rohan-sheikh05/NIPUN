import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProfile, listSkills, setStudentSkills, upsertClientProfile, upsertStudentProfile } from '../lib/api';
import type { OrgType, Skill, UserRole } from '../types/database';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FieldGroup, Input, Label, Select, Textarea } from '../components/ui/Field';

export function Onboarding() {
  const { session, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Shared
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');

  // Student-only
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Client-only
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('startup');

  useEffect(() => {
    if (role === 'student') listSkills().then(setSkills);
  }, [role]);

  function toggleSkill(id: string) {
    setSelectedSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (!session || !role) return;
    setSaving(true);
    setError(null);
    try {
      await createProfile({ id: session.user.id, role, full_name: fullName, university, department });

      if (role === 'student') {
        await upsertStudentProfile({
          profile_id: session.user.id,
          bio,
          hourly_rate: hourlyRate ? Number(hourlyRate) : null,
        });
        await setStudentSkills(session.user.id, selectedSkills);
      } else if (role === 'client') {
        await upsertClientProfile({ profile_id: session.user.id, org_name: orgName, org_type: orgType });
      }

      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <p className="label-tag mb-2">Step 01 / 02</p>
        <h1 className="font-display text-2xl font-semibold mb-8">Who are you on NIPUN?</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card
            cropmark
            className="cursor-pointer hover:border-signal-500 transition-colors"
            onClick={() => {
              setRole('student');
              setStep(2);
            }}
          >
            <p className="label-tag mb-2">Provider</p>
            <h2 className="font-display font-semibold mb-2">I'm a student</h2>
            <p className="text-line-500 text-sm">I want to take on paid technical work and teach peers.</p>
          </Card>
          <Card
            cropmark
            className="cursor-pointer hover:border-signal-500 transition-colors"
            onClick={() => {
              setRole('client');
              setStep(2);
            }}
          >
            <p className="label-tag mb-2">Requester</p>
            <h2 className="font-display font-semibold mb-2">I'm a client</h2>
            <p className="text-line-500 text-sm">I want to post technical work for verified students.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <p className="label-tag mb-2">Step 02 / 02</p>
      <h1 className="font-display text-2xl font-semibold mb-8">
        {role === 'student' ? 'Build your student profile' : 'Set up your organization'}
      </h1>

      <FieldGroup>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </FieldGroup>

      {role === 'student' && (
        <>
          <FieldGroup>
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              placeholder="BUET"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="MME"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="rate">Hourly rate (BDT, optional)</Label>
            <Input id="rate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Skills</Label>
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
        </>
      )}

      {role === 'client' && (
        <>
          <FieldGroup>
            <Label htmlFor="orgName">Organization name</Label>
            <Input id="orgName" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="orgType">Organization type</Label>
            <Select id="orgType" value={orgType} onChange={(e) => setOrgType(e.target.value as OrgType)}>
              <option value="government">Government</option>
              <option value="ngo">NGO</option>
              <option value="private">Private industry</option>
              <option value="startup">Startup</option>
              <option value="individual">Individual</option>
            </Select>
          </FieldGroup>
        </>
      )}

      {error && <p className="text-danger-500 text-sm mb-4">{error}</p>}

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={saving || !fullName}>
          {saving ? 'Saving…' : 'Finish setup'}
        </Button>
      </div>
    </div>
  );
}
