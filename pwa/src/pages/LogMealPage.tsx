import { useState, useRef } from 'react';
import { Typography, Button, Card } from '../components/ui';

/**
 * LogMealPage - Photo capture with refined UI
 *
 * Emphasizes the camera action with clean visual hierarchy
 */

export function LogMealPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
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
    setTimeout(() => {
      setIsAnalyzing(false);
      console.log('Analysis complete');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10">
        <Typography variant="h2" className="text-gray-900">
          Log Meal
        </Typography>
        <Typography variant="bodySmall" color="secondary" className="mt-0.5">
          Capture your meal for instant analysis
        </Typography>
      </div>

      <div className="px-5 py-5">
        {!selectedImage ? (
          /* Camera Prompt */
          <div className="animate-scale-in">
            <Card padding="none" variant="elevated" className="overflow-hidden">
              {/* Large camera area */}
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b border-gray-200">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-md flex items-center justify-center">
                    <CameraIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <Typography variant="body" color="secondary" className="font-medium">
                    Ready to scan
                  </Typography>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Action area */}
              <div className="p-5">
                <Button
                  title="Open Camera"
                  onClick={handleTakePhoto}
                  size="lg"
                  fullWidth
                  className="mb-4"
                />

                <Card variant="filled" padding="md">
                  <Typography variant="label" className="mb-2 text-gray-700">
                    Tips for best results:
                  </Typography>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <Typography variant="bodySmall" color="secondary">
                        Place food on scale with display visible
                      </Typography>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <Typography variant="bodySmall" color="secondary">
                        Use good lighting for accuracy
                      </Typography>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <Typography variant="bodySmall" color="secondary">
                        Include all items in frame
                      </Typography>
                    </li>
                  </ul>
                </Card>
              </div>
            </Card>
          </div>
        ) : (
          /* Photo Preview */
          <div className="space-y-4 animate-scale-in">
            <Card padding="none" variant="elevated" className="overflow-hidden">
              <img
                src={selectedImage}
                alt="Meal preview"
                className="w-full h-auto"
              />
            </Card>

            {/* Analysis indicator */}
            {isAnalyzing && (
              <Card variant="filled" padding="md" className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <Typography variant="body" color="secondary" className="font-medium">
                    Analyzing your meal...
                  </Typography>
                </div>
              </Card>
            )}

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
          </div>
        )}
      </div>
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
