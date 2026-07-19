import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="label-tag mb-2">404 — off the drawing</p>
      <h1 className="font-display text-3xl font-semibold mb-6">This page doesn't exist.</h1>
      <Link to="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </div>
  );
}
