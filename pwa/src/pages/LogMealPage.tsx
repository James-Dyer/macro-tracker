import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, Card } from '../components/ui';
import { supabase } from '../services/supabase';
import { compressImage, validateImage, uploadMealPhoto } from '../utils/imageUtils';
import { logger } from '../utils/logger';
import { parseSupabaseFunctionError } from '../utils/errors';

/**
 * LogMealPage - Photo capture with refined UI
 *
 * Emphasizes the camera action with clean visual hierarchy
 * Auto-opens camera on mount for seamless experience
 */

export function LogMealPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzeRunId = useRef(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check for pre-selected file from navigation state
  useEffect(() => {
    const preSelectedFile = location.state?.selectedFile as File | undefined;
    if (preSelectedFile) {
      // Validate image
      const validation = validateImage(preSelectedFile);
      if (validation.valid) {
        const imageUrl = URL.createObjectURL(preSelectedFile);
        setSelectedImage(imageUrl);
        setSelectedFile(preSelectedFile);
      } else {
        setError(validation.error || 'Invalid image');
      }
    }
  }, [location.state]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setSelectedFile(file);
    setError(null);
  };

  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    analyzeRunId.current += 1; // cancel any in-flight analysis
    setIsAnalyzing(false);
    setError(null);
    setUserContext('');
    setSelectedFile(null);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Trigger file input directly (works in click handler)
    fileInputRef.current?.click();
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      void analyzePhoto(selectedFile);
    }
  };

  const analyzePhoto = async (file: File) => {
    const runId = ++analyzeRunId.current;
    setIsAnalyzing(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Please sign in to log meals');
      }

      // Compress image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });

      // Upload to Storage
      const uploadResult = await uploadMealPhoto(compressedFile, user.id);
      if ('error' in uploadResult) {
        throw new Error(uploadResult.error);
      }

      // Check if this analysis was cancelled
      if (analyzeRunId.current !== runId) return;

      // Get session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Call analyze-meal Edge Function with explicit Authorization header
      const { data, error: analyzeError } = await supabase.functions.invoke(
        'analyze-meal',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            photoPath: uploadResult.path,
            useScale: true,
            context: userContext.trim() || undefined,
          },
        }
      );

      if (analyzeError) {
        // Parse structured error from Edge Function
        const appError = parseSupabaseFunctionError(analyzeError);
        logger.error('Edge Function error', {
          error: appError,
          photoPath: uploadResult.path,
        });
        throw new Error(appError.message);
      }

      // Check if this analysis was cancelled
      if (analyzeRunId.current !== runId) return;

      // Navigate to ConfirmMealPage with results
      navigate('/dashboard/confirm', {
        state: {
          ...data,
          photoPath: uploadResult.path,
          thumbnailPath: uploadResult.thumbnailPath,
          userContext: userContext.trim(),
        },
      });
    } catch (err) {
      const appError = parseSupabaseFunctionError(err);
      logger.error('Meal analysis failed', {
        error: appError,
        hasPhoto: !!file,
      });

      if (analyzeRunId.current === runId) {
        setError(appError.message);
        setIsAnalyzing(false);
      }
    }
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="px-5 py-5">
        {!selectedImage ? (
          /* Camera Prompt */
          <div className="animate-fade-in">
            <Card padding="none" variant="elevated" className="overflow-hidden">
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

            {/* User Context Input */}
            {!isAnalyzing && (
              <Card variant="filled" padding="md">
                <Typography variant="label" className="text-gray-700 mb-2">
                  Additional Context (Optional)
                </Typography>
                <Typography variant="bodySmall" color="secondary" className="mb-3">
                  Add details to improve accuracy (e.g., "air fried", "grilled salmon")
                </Typography>
                <textarea
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  maxLength={500}
                  placeholder="Example: grilled chicken, no sauce"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  rows={3}
                />
                <Typography variant="bodySmall" color="secondary" className="mt-1 text-right">
                  {userContext.length}/500
                </Typography>
              </Card>
            )}

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

            {/* Error Message */}
            {error && (
              <Card variant="filled" padding="md" className="bg-red-50 border border-red-200">
                <Typography variant="body" className="text-red-700">
                  {error}
                </Typography>
              </Card>
            )}

            <div className="space-y-2">
              {!isAnalyzing && (
                <Button
                  title="Analyze Meal"
                  onClick={handleAnalyze}
                  size="lg"
                  fullWidth
                />
              )}
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
