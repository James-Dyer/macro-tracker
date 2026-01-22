import { useState, useRef } from 'react';
import { Typography, Button, Card } from '../components/ui';

/**
 * LogMealPage - Photo capture and meal logging
 *
 * Flow:
 * 1. User taps "Take Photo" button
 * 2. iOS native camera opens (via file input)
 * 3. User takes photo → "Retake / Use Photo"
 * 4. On "Use Photo", show preview
 * 5. User taps "Analyze" → AI processes image
 * 6. Navigate to confirmation screen (to be built)
 */

export function LogMealPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);

    // TODO: Compress image before upload
    // TODO: Upload to Supabase Storage
    // TODO: Call AI Edge Function
  };

  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    // TODO: Implement AI analysis
    // 1. Compress image
    // 2. Upload to Supabase Storage
    // 3. Call AI Edge Function with image URL
    // 4. Navigate to confirmation screen with results

    setTimeout(() => {
      setIsAnalyzing(false);
      console.log('Analysis complete');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <Typography variant="h2">Log Meal</Typography>
        <Typography variant="bodySmall" color="secondary">
          Take a photo of your meal to get started
        </Typography>
      </div>

      <div className="p-4">
        {!selectedImage ? (
          /* Camera Prompt */
          <Card padding="lg" className="text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <CameraIcon />
              </div>
              <Typography variant="h3" className="mb-2">
                Take a Photo
              </Typography>
              <Typography variant="body" color="secondary">
                For best results, place your meal on a scale and ensure the
                display is visible in the photo
              </Typography>
            </div>

            {/* Hidden file input for iOS camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              title="Open Camera"
              onClick={handleTakePhoto}
              size="lg"
              fullWidth
            />

            <div className="mt-4">
              <Typography variant="caption" color="tertiary">
                Works best with good lighting
              </Typography>
            </div>
          </Card>
        ) : (
          /* Photo Preview */
          <div className="space-y-4">
            <Card padding="none">
              <img
                src={selectedImage}
                alt="Meal preview"
                className="w-full h-auto rounded-xl"
              />
            </Card>

            <div className="space-y-2">
              <Button
                title={isAnalyzing ? 'Analyzing...' : 'Analyze Meal'}
                onClick={handleAnalyze}
                loading={isAnalyzing}
                size="lg"
                fullWidth
              />
              <Button
                title="Retake Photo"
                variant="secondary"
                onClick={handleRetake}
                disabled={isAnalyzing}
                size="lg"
                fullWidth
              />
            </div>

            <Card padding="md" variant="filled">
              <Typography variant="label" className="mb-2">
                Tips for best results:
              </Typography>
              <ul className="space-y-1">
                <li>
                  <Typography variant="bodySmall" color="secondary">
                    • Ensure the scale display is clearly visible
                  </Typography>
                </li>
                <li>
                  <Typography variant="bodySmall" color="secondary">
                    • Good lighting helps AI accuracy
                  </Typography>
                </li>
                <li>
                  <Typography variant="bodySmall" color="secondary">
                    • Include all food items in frame
                  </Typography>
                </li>
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      className="w-12 h-12 text-gray-400"
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
  );
}
