import { useNavigate } from 'react-router-dom';
import { Typography, Button } from '../../components/ui';

export function OnboardingFirstMealPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Typography variant="h2" className="text-center">
            Log Your First Meal
          </Typography>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center animate-scale-in">
          {/* Large Camera Icon */}
          <div className="mb-8 mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/30">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <Typography variant="h2" className="mb-4">
            Ready to get started?
          </Typography>

          <Typography variant="body" color="secondary" className="mb-8">
            Photograph your next meal on a food scale, and we'll help you track the nutrition automatically.
          </Typography>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                ✓
              </div>
              <Typography variant="bodySmall" color="secondary">
                Works with any food - home cooked, takeout, or packaged
              </Typography>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                ✓
              </div>
              <Typography variant="bodySmall" color="secondary">
                Automatic weight reading from your digital scale
              </Typography>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                ✓
              </div>
              <Typography variant="bodySmall" color="secondary">
                Complete nutrition breakdown in seconds
              </Typography>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTAs */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 safe-area-pb">
        <div className="max-w-2xl mx-auto px-6 py-4 space-y-3">
          <Button
            title="Take a Photo"
            onClick={() => navigate('/dashboard/log')}
            fullWidth
            size="lg"
            className="shadow-lg"
          />
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}
