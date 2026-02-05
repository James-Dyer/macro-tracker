import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button } from '../../components/ui';

export function OnboardingHowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Typography variant="h2" className="text-center">
            How It Works
          </Typography>
          <Typography variant="bodySmall" color="secondary" className="text-center mt-2">
            Track your nutrition in three simple steps
          </Typography>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Step 1 */}
          <Card className="animate-slide-up stagger-1">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-2xl">
                📷
              </div>
              <div className="flex-1">
                <Typography variant="h3" className="mb-2 text-gray-900">
                  Take a Photo
                </Typography>
                <Typography variant="body" color="secondary">
                  Snap a picture of your meal on a food scale. Works with plates, bowls, takeout, and home cooking.
                </Typography>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="animate-slide-up stagger-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl">
                🤖
              </div>
              <div className="flex-1">
                <Typography variant="h3" className="mb-2 text-gray-900">
                  AI Identifies Foods
                </Typography>
                <Typography variant="body" color="secondary">
                  Our AI recognizes foods, reads the scale weight, and calculates complete nutrition data automatically.
                </Typography>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="animate-slide-up stagger-3">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-2xl">
                ✏️
              </div>
              <div className="flex-1">
                <Typography variant="h3" className="mb-2 text-gray-900">
                  Review & Adjust
                </Typography>
                <Typography variant="body" color="secondary">
                  Check the results and make any edits before saving. You're always in control of your data.
                </Typography>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-2 border-blue-200 animate-slide-up stagger-4">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <Typography variant="bodySmall" className="text-blue-900">
                  <strong>Pro tip:</strong> For best results, place food on a digital scale before photographing. The AI will read the weight and identify your foods for accurate tracking.
                </Typography>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom CTAs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 safe-area-pb">
        <div className="max-w-2xl mx-auto px-6 py-4 space-y-3">
          <Button
            title="Try It Now"
            onClick={() => navigate('/dashboard/onboarding/first-meal')}
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
