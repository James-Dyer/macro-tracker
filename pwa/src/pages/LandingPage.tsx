import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';

const LINKEDIN_INVITE_URL = 'https://www.linkedin.com/in/jamesthedyer/';

const productShots = [
  {
    src: '/landing/demo-shot-1.jpg',
    alt: 'MacroTracker onboarding and setup screen',
    label: 'Onboarding',
  },
  {
    src: '/landing/demo-shot-2.jpg',
    alt: 'MacroTracker meal logging flow',
    label: 'Meal Capture',
  },
  {
    src: '/landing/demo-shot-3.jpg',
    alt: 'MacroTracker meal history and nutrition review',
    label: 'Review',
  },
];

const betaSteps = [
  {
    number: '01',
    title: 'Request Invite',
    description: 'Reach out on LinkedIn to get added to the closed beta list.',
  },
  {
    number: '02',
    title: 'Get Your Code',
    description: 'You will receive an invite code once you are approved for testing.',
  },
  {
    number: '03',
    title: 'Start Logging',
    description: 'Use your invite to sign up, test the flow, and send feedback.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  const handleInviteCTA = () => {
    window.open(LINKEDIN_INVITE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleInvitedCTA = () => {
    navigate('/login?mode=signup');
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gray-950 text-white relative">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #22c55e 1px, transparent 1px),
            linear-gradient(to bottom, #22c55e 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary-light/10 blur-[140px]" />

      <section className="relative px-6 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="animate-fade-in mb-14 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-gray-950 shadow-lg shadow-primary-light/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                  <path d="M2 17L12 22L22 17" />
                  <path d="M2 12L12 17L22 12" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">MacroTracker</div>
                <div className="text-sm text-gray-400">Closed beta nutrition tracker</div>
              </div>
            </div>

            <a
              href={LINKEDIN_INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-gray-700 bg-gray-900/70 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-primary-light/40 hover:text-white md:inline-flex"
            >
              Request Invite
            </a>
          </div>

          <div className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <div className="animate-slide-up space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-light/30 bg-primary-light/10 px-4 py-1.5 text-sm font-medium text-primary-light">
                  <span className="h-2 w-2 rounded-full bg-primary-light" />
                  Closed beta. Invite required.
                </div>

                <h1 className="max-w-3xl text-5xl font-bold leading-[0.94] tracking-tight md:text-7xl">
                  Snap meals.
                  <br />
                  <span className="text-primary-light">Check macros fast.</span>
                </h1>

                <p className="max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                  MacroTracker is a photo-first nutrition app for beta testers who want a faster way to log meals. Take a photo, review the AI estimate, and save your macros without digging through food databases.
                </p>
              </div>

              <div className="animate-slide-up stagger-1 flex flex-col gap-4 sm:flex-row">
                <Button
                  title="Request An Invite"
                  onClick={handleInviteCTA}
                  size="lg"
                  className="!bg-primary-light !text-gray-950 hover:!bg-[#4ade80] active:!bg-primary text-lg shadow-lg shadow-primary-light/20"
                />
                <button
                  onClick={handleInvitedCTA}
                  className="min-h-[56px] rounded-xl border-2 border-gray-700 px-8 py-4 text-lg font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-900/70"
                >
                  I Have An Invite Code
                </button>
              </div>

              <div className="animate-slide-up stagger-2 grid gap-4 sm:grid-cols-3">
                <StatCard value="Closed Beta" label="Current access model" />
                <StatCard value="Photo First" label="Core logging flow" />
                <StatCard value="Invite Only" label="For active testers" />
              </div>

              <div className="animate-slide-up stagger-3 rounded-2xl border border-gray-800 bg-gray-900/70 p-5 backdrop-blur">
                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary-light">
                  What To Expect
                </div>
                <p className="text-gray-300">
                  This is a testing build, not a public launch. If you want access, request an invite on LinkedIn. If you already have a code, use it to sign up and start testing immediately.
                </p>
              </div>
            </div>

            <div className="animate-scale-in">
              <HeroMedia />
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-gray-900 bg-gray-900/70 px-6 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary-light">
              Why People Want It
            </div>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Faster than manual tracking, without pretending it is finished.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <BenefitCard
              icon={<ZapIcon />}
              title="Fast Capture"
              description="Log a meal from a single photo instead of searching and entering each ingredient by hand."
            />
            <BenefitCard
              icon={<BrainIcon />}
              title="Editable AI Estimates"
              description="The app gives you a starting point fast, then lets you review and adjust before saving."
            />
            <BenefitCard
              icon={<ChartIcon />}
              title="Useful Macro View"
              description="Calories, protein, carbs, fat, and fiber are summarized in a way that is easy to scan during the day."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary-light">
                Beta Access
              </div>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Clear path in, clear expectations.
              </h2>
            </div>
            <p className="max-w-xl text-gray-400">
              The landing page now matches the product state: closed beta for testing, invite required, real product visuals, no inflated claims.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {betaSteps.map((step) => (
              <StepCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary-light">
                Product Preview
              </div>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Real screens from the current build.
              </h2>
            </div>
            <p className="max-w-xl text-gray-400">
              These are pulled from your current app recording and thumbnail rather than placeholders.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[2rem] border border-gray-800 bg-gray-950 shadow-2xl shadow-black/40">
              <video
                className="h-full w-full object-cover"
                src="/landing/app-demo.mp4"
                poster="/landing/demo-shot-2.jpg"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div className="overflow-hidden rounded-[2rem] border border-gray-800 bg-gray-900/70">
                <img
                  src="/landing/macro-thumbnail.jpg"
                  alt="MacroTracker summary thumbnail"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {productShots.map((shot) => (
                  <figure
                    key={shot.src}
                    className="overflow-hidden rounded-[1.5rem] border border-gray-800 bg-gray-900/70"
                  >
                    <img
                      src={shot.src}
                      alt={shot.alt}
                      className="aspect-[9/16] h-full w-full object-cover"
                    />
                    <figcaption className="border-t border-gray-800 px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                      {shot.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-primary-light/20 bg-gradient-to-br from-primary-light/10 via-gray-900 to-gray-950 p-10 text-center shadow-2xl shadow-primary-light/5 md:p-14">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary-light">
            Closed Beta CTA
          </div>
          <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
            Want to test MacroTracker?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-300">
            Request an invite on LinkedIn if you want access to the beta. If you already have a code, head to signup and unlock the app there.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              title="Request Invite On LinkedIn"
              onClick={handleInviteCTA}
              size="lg"
              className="!bg-primary-light !text-gray-950 hover:!bg-[#4ade80] active:!bg-primary text-lg"
            />
            <button
              onClick={handleInvitedCTA}
              className="min-h-[56px] rounded-xl border-2 border-gray-700 px-8 py-4 text-lg font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-900/70"
            >
              Sign Up With Invite Code
            </button>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-gray-900 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-gray-950">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
            <span className="font-semibold text-gray-200">MacroTracker</span>
          </div>

          <div className="flex flex-col gap-2 text-left md:items-end">
            <span>Closed beta for invite-based testing.</span>
            <a
              href={LINKEDIN_INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary-light transition hover:text-[#4ade80]"
            >
              linkedin.com/in/jamesthedyer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroMedia() {
  return (
    <div className="relative mx-auto max-w-lg">
      <div className="absolute -inset-6 rounded-[3rem] bg-primary-light/10 blur-3xl" />

      <div className="relative rounded-[2.5rem] border border-gray-800 bg-gray-900/80 p-3 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="overflow-hidden rounded-[2rem] border border-gray-800 bg-gray-950">
          <video
            className="h-[680px] w-full object-cover"
            src="/landing/app-demo.mp4"
            poster="/landing/demo-shot-2.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        <FloatingBadge
          className="absolute -left-8 top-10"
          label="Status"
          value="Beta"
        />
        <FloatingBadge
          className="absolute -right-6 bottom-16"
          label="Flow"
          value="Photo"
        />
      </div>
    </div>
  );
}

function FloatingBadge({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className={`${className} hidden rounded-2xl border border-primary-light/30 bg-gray-950/95 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur md:block`}>
      <div className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-primary-light">{value}</div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-4 backdrop-blur">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-gray-400">{label}</div>
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-[1.75rem] border border-gray-800 bg-gray-900/70 p-8 backdrop-blur transition hover:border-primary-light/30 hover:bg-gray-900">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-light/20 bg-primary-light/10">
        {icon}
      </div>
      <h3 className="mb-3 text-2xl font-bold tracking-tight">{title}</h3>
      <p className="leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="rounded-[1.75rem] border border-gray-800 bg-gray-900/60 p-8 backdrop-blur">
      <div className="mb-5 text-6xl font-bold leading-none text-gray-800">{number}</div>
      <h3 className="mb-3 text-2xl font-bold tracking-tight">{title}</h3>
      <p className="leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

function ZapIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-light">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-light">
      <path d="M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
      <path d="M12 14v6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-light">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
