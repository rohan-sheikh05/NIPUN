import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { TitleBlockMeta, Card } from '../components/ui/Card';

const skillCategories = [
  'SolidWorks & CAD',
  'PCB Design',
  'Materials Analysis',
  'Data Analysis',
  'Embedded Systems',
  'LaTeX & Technical Writing',
];

export function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-8 pb-16 md:pt-16 md:pb-24 border-b border-blueprint-700">
        <p className="label-tag mb-4">National Initiative for Professional Undergraduate Networking</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] max-w-3xl">
          Stop teaching O-level physics.
          <br />
          <span className="text-signal-500">Get paid for the CAD file.</span>
        </h1>
        <p className="mt-6 max-w-xl text-line-300 text-base leading-relaxed">
          Every semester, engineering students trade their SolidWorks, PCB, and materials-analysis
          skills for tutoring gigs — because there's no verified place to sell the skills they
          actually came here to build. NIPUN is that place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/signup"><Button size="md">Join as a student</Button></Link>
          <Link to="/signup"><Button size="md" variant="secondary">Post a job as a client</Button></Link>
        </div>

        <Card className="mt-12 max-w-2xl" cropmark>
          <p className="label-tag">Target — 24 months</p>
          <TitleBlockMeta
            fields={[
              { label: 'Verified students', value: '2,500+' },
              { label: 'Paid tasks', value: '15,000+' },
              { label: 'Peer-learning hours', value: '500+' },
              { label: 'Platform fee', value: '2–5%' },
            ]}
          />
        </Card>
      </section>

      {/* How it works */}
      <section className="py-16 border-b border-blueprint-700 grid md:grid-cols-2 gap-8">
        <Card>
          <p className="label-tag mb-2">Track 01</p>
          <h2 className="font-display text-xl font-semibold mb-3">Professional services</h2>
          <p className="text-line-300 text-sm leading-relaxed">
            Clients — SMEs, startups, research bodies — post real short-term technical work.
            Verified students apply with a proposal, get hired, deliver through the platform, and
            get paid through escrow. No unpaid trial tasks, no ghosting.
          </p>
        </Card>
        <Card>
          <p className="label-tag mb-2">Track 02</p>
          <h2 className="font-display text-xl font-semibold mb-3">Peer-to-peer learning</h2>
          <p className="text-line-300 text-sm leading-relaxed">
            Students who've mastered a tool run paid sessions for peers who want to catch up —
            turning the skill gap between batches into an internal economy instead of a silent
            disadvantage.
          </p>
        </Card>
      </section>

      {/* Skill categories */}
      <section className="py-16">
        <p className="label-tag mb-4">Skill categories, from the curriculum out</p>
        <div className="flex flex-wrap gap-2">
          {skillCategories.map((s) => (
            <span
              key={s}
              className="font-mono text-xs px-3 py-1.5 border border-blueprint-600 rounded-sm text-line-300"
            >
              {s}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
