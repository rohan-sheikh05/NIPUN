import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { FieldGroup, Input, Label } from '../components/ui/Field';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/dashboard');
  }

  return (
    <div className="max-w-sm mx-auto py-12">
      <p className="label-tag mb-2">Sign in</p>
      <h1 className="font-display text-2xl font-semibold mb-8">Welcome back</h1>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FieldGroup>

        {error && <p className="text-danger-500 text-sm mb-4">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-line-500">
        New to NIPUN?{' '}
        <Link to="/signup" className="text-signal-400 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
