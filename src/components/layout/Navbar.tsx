import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-blueprint-700 bg-blueprint-950/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-lg font-semibold tracking-tight text-line-100">
            NIPUN<span className="text-signal-500">.</span>
          </span>
          {/* <span className="hidden sm:inline label-tag">rev. 01 — mvp</span> */}
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/jobs" className="px-3 py-2 text-sm text-line-300 hover:text-line-100 transition-colors">
            Browse jobs
          </Link>

          {session && profile?.role === 'client' && (
            <Link to="/post-job" className="px-3 py-2 text-sm text-line-300 hover:text-line-100 transition-colors">
              Post a job
            </Link>
          )}

          {session ? (
            <>
              <Link to="/dashboard" className="px-3 py-2 text-sm text-line-300 hover:text-line-100 transition-colors">
                Dashboard
              </Link>
              <Button size="sm" variant="secondary" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm text-line-300 hover:text-line-100 transition-colors">
                Log in
              </Link>
              <Link to="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
