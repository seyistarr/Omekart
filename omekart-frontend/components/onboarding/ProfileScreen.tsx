'use client';

import { useRef, useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { SIMULATED_CAMERA_ASSETS } from '@/lib/onboarding/onboardingData';
import { uploadMedia } from '@/lib/api/upload-media';

export default function ProfileScreen() {
  const { navigateTo, avatarSrc, setAvatarSrc, setAvatarUrl, userId } = useOnboarding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetPointerRef = useRef(0);
  const [previewSrc, setPreviewSrc] = useState<string>(avatarSrc ?? '/onboarding/image_4.jpg');
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewSrc(result);
      setAvatarSrc(result);
      // Upload immediately
      uploadAndSet(result);
    };
    reader.readAsDataURL(file);
  }

  function handleCameraCapture() {
    const asset = SIMULATED_CAMERA_ASSETS[assetPointerRef.current];
    setPreviewSrc(asset);
    setAvatarSrc(asset);
    assetPointerRef.current = (assetPointerRef.current + 1) % SIMULATED_CAMERA_ASSETS.length;
    // Upload immediately for camera assets too
    uploadAndSet(asset);
  }

  async function uploadAndSet(base64OrUrl: string) {
    if (!userId) {
      console.warn('No user ID available for upload.');
      return;
    }
    // If it's a local URL (starts with /onboarding/), fetch it as blob
    let base64 = base64OrUrl;
    if (base64OrUrl.startsWith('/onboarding/')) {
      try {
        const response = await fetch(base64OrUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        base64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error('Failed to convert local image to base64', err);
        return;
      }
    }
    setIsUploading(true);
    try {
      const result = await uploadMedia({
        image: base64,
        type: 'avatar',
        entity_id: userId,
      });
      setAvatarUrl(result.url);
      console.log('Avatar uploaded successfully:', result.url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Failed to upload avatar. You can try again later.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleContinue() {
    navigateTo('verified');
  }

  return (
    <section className="flex flex-col flex-1 py-1 justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateTo('hubs')}
            className="w-9 h-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-chevron-left text-sm" />
          </button>
          <div className="flex space-x-1">
            <span className="w-2 h-1.5 rounded-full bg-violet-600/40" />
            <span className="w-5 h-1.5 rounded-full bg-violet-600" />
            <span className="w-2 h-1.5 rounded-full bg-slate-200" />
            <span className="w-2 h-1.5 rounded-full bg-slate-200" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set Profile Identity</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add a premium avatar picture so buyers and dispatch nodes recognize you instantly.
        </p>
        <div className="flex flex-col items-center my-8 relative">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 ring-2 ring-slate-100 transition-transform group-hover:scale-105">
              <img src={previewSrc} className="w-full h-full object-cover" alt="Profile avatar" />
            </div>
            <div className="absolute bottom-1 right-1 w-9 h-9 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-colors group-hover:bg-violet-700">
              <i className="fas fa-pen text-xs" />
            </div>
          </div>
          {isUploading && <p className="text-sm text-violet-600 mt-2">Uploading...</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="space-y-3">
        <button
          onClick={handleCameraCapture}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-md shadow-violet-600/10"
        >
          <i className="fas fa-camera text-sm" /> <span>Capture Instantly</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2.5 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <i className="fas fa-images text-sm text-slate-400" /> <span>Choose From Files</span>
        </button>
        <button
          onClick={handleContinue}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl mt-2 transition-all text-center block"
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Continue'}
        </button>
      </div>
    </section>
  );
}