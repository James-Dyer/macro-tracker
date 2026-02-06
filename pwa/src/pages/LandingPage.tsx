import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { useEffect, useState } from 'react';

/**
 * LandingPage - Marketing page for MacroTracker
 *
 * Aesthetic: "Precision Tech" - Bold typography, data-driven visuals,
 * subtle grid patterns, and smooth orchestrated animations.
 * Emphasizes accuracy and AI intelligence without feeling generic.
 */

export function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    setIsVisible(true);
  }, []);

  const handleCTA = () => {
    navigate('/login?mode=signup');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: `
               linear-gradient(to right, #22c55e 1px, transparent 1px),
               linear-gradient(to bottom, #22c55e 1px, transparent 1px)
             `,
             backgroundSize: '40px 40px'
           }}
      />

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Logo/Brand */}
          <div className={`mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                  <path d="M2 17L12 22L22 17" />
                  <path d="M2 12L12 17L22 12" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">MacroTracker</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className={`space-y-4 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-block px-4 py-1.5 rounded-full bg-primary-light/10 border border-primary-light/20 text-primary-light text-sm font-medium">
                  AI-Powered Nutrition
                </div>
                <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight">
                  Track macros<br />
                  <span className="text-primary-light">with precision</span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                  Take one photo of your meal. AI instantly identifies your food, estimates portions, and calculates complete nutrition data—all in seconds.
                </p>
              </div>

              <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <Button
                  title="Start tracking free"
                  onClick={handleCTA}
                  size="lg"
                  className="!bg-primary-light hover:!bg-primary active:!bg-primary-dark text-lg"
                />
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 min-h-[56px] rounded-xl border-2 border-gray-700 text-gray-200 hover:border-gray-600 hover:bg-gray-800/50 transition-all font-semibold text-lg"
                >
                  See how it works
                </button>
              </div>

              {/* Social Proof */}
              <div className={`flex items-center gap-6 pt-4 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary border-2 border-gray-900 flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-white font-semibold">1,200+</span> people tracking with precision
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="relative px-6 py-24 bg-gray-800/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              No more guessing.<br />
              <span className="text-primary-light">Just results.</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Stop estimating portions and scrolling through food databases. Get instant results with zero manual entry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={<ZapIcon />}
              title="Instant Tracking"
              description="One photo, complete nutrition. Log meals in under 10 seconds—no typing, no searching, no equipment."
              delay="delay-[100ms]"
            />
            <BenefitCard
              icon={<BrainIcon />}
              title="Vision AI"
              description="Gemini Pro identifies foods instantly. Rice, chicken, veggies—all recognized with context-aware precision."
              delay="delay-[200ms]"
            />
            <BenefitCard
              icon={<ChartIcon />}
              title="Complete Data"
              description="Calories, protein, carbs, fat, fiber—calculated automatically from visual analysis, no manual entry."
              delay="delay-[300ms]"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ten seconds to<br />
              <span className="text-primary-light">complete nutrition</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            <StepCard
              number="01"
              title="Snap Photo"
              description="Take a quick picture of your meal—that's it"
              delay="delay-[100ms]"
            />
            <StepCard
              number="02"
              title="AI Analyzes"
              description="Vision AI instantly identifies foods and estimates portions"
              delay="delay-[200ms]"
            />
            <StepCard
              number="03"
              title="Done"
              description="Review complete macros and save—all in under 10 seconds"
              delay="delay-[300ms]"
            />
          </div>

          {/* Demo Screenshot Placeholder */}
          <div className="mt-16 relative">
            <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary-light/10 border-2 border-primary-light/30 flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16V12M12 8H12.01" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">App interface preview</p>
                </div>
              </div>
              {/* Simulated phone frames */}
              <div className="absolute bottom-8 left-8 w-64 h-[520px] bg-gray-950 rounded-3xl border-4 border-gray-800 shadow-2xl opacity-90 transform -rotate-6" />
              <div className="absolute bottom-8 right-8 w-64 h-[520px] bg-gray-950 rounded-3xl border-4 border-gray-800 shadow-2xl opacity-90 transform rotate-6" />
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator Section */}
      <section className="relative px-6 py-24 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl border-2 border-primary-light/20 bg-gray-900/50 backdrop-blur p-12 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-light/5 blur-[100px] rounded-full" />

            <div className="relative space-y-6 text-center">
              <div className="inline-block px-5 py-2 rounded-full bg-primary-light/10 border border-primary-light/30 text-primary-light text-sm font-semibold">
                The MacroTracker Difference
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                One photo beats<br />
                tedious manual entry every time
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                While other apps make you search databases, type food names, and manually enter portions, MacroTracker gives you <span className="text-white font-semibold">complete nutrition in 10 seconds</span>. Just snap and track—no typing, no searching, no equipment needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Stop guessing.<br />
            <span className="text-primary-light">Start knowing.</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-xl mx-auto">
            Join thousands tracking nutrition with precision. Free to start, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              title="Get started free"
              onClick={handleCTA}
              size="lg"
              className="!bg-primary-light hover:!bg-primary active:!bg-primary-dark text-lg"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                  <path d="M2 17L12 22L22 17" />
                  <path d="M2 12L12 17L22 12" />
                </svg>
              </div>
              <span className="font-semibold">MacroTracker</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2026 MacroTracker. AI-powered precision nutrition.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Hero Visual Component
function HeroVisual() {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      {/* Animated ring elements */}
      <div className="absolute inset-0 animate-pulse">
        <div className="absolute inset-0 rounded-full border-2 border-primary-light/20" />
        <div className="absolute inset-8 rounded-full border-2 border-primary-light/30" />
        <div className="absolute inset-16 rounded-full border-2 border-primary-light/40" />
      </div>

      {/* Center mockup */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Phone frame mockup */}
          <div className="w-72 h-[580px] bg-gray-950 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden relative">
            {/* Screen content */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
              {/* Mock UI elements */}
              <div className="space-y-6 mt-12">
                <div className="h-3 w-24 bg-gray-700 rounded" />
                <div className="h-8 w-full bg-gray-700 rounded-lg" />

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="aspect-square bg-primary-light/10 border border-primary-light/30 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-light">87%</div>
                      <div className="text-xs text-gray-400 mt-1">Protein</div>
                    </div>
                  </div>
                  <div className="aspect-square bg-protein/10 border border-protein/30 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-protein">64%</div>
                      <div className="text-xs text-gray-400 mt-1">Carbs</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="h-20 bg-gray-800 rounded-xl border border-gray-700" />
                  <div className="h-20 bg-gray-800 rounded-xl border border-gray-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating data badges */}
          <FloatingBadge
            className="absolute -top-4 -right-4 animate-slide-up"
            label="Calories"
            value="487"
            delay="delay-500"
          />
          <FloatingBadge
            className="absolute -bottom-4 -left-4 animate-slide-up"
            label="Protein"
            value="42g"
            delay="delay-700"
          />
        </div>
      </div>
    </div>
  );
}

// Floating Badge Component
function FloatingBadge({ className, label, value, delay }: { className: string; label: string; value: string; delay: string }) {
  return (
    <div className={`${className} ${delay}`}>
      <div className="bg-gray-900 border-2 border-primary-light/30 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-primary-light tabular-nums">{value}</div>
      </div>
    </div>
  );
}

// Benefit Card Component
function BenefitCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: string }) {
  return (
    <div className={`group relative animate-slide-up ${delay}`}>
      <div className="relative h-full bg-gray-900/50 border border-gray-700 rounded-2xl p-8 hover:border-primary-light/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/5">
        <div className="w-14 h-14 rounded-xl bg-primary-light/10 border border-primary-light/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Step Card Component
function StepCard({ number, title, description, delay }: { number: string; title: string; description: string; delay: string }) {
  return (
    <div className={`relative animate-slide-up ${delay}`}>
      <div className="relative">
        <div className="text-7xl font-bold text-gray-800 mb-4">{number}</div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
      {/* Connector line (hidden on last item) */}
      {number !== "03" && (
        <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-light/30 to-transparent" />
      )}
    </div>
  );
}

// Icon Components
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
