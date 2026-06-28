'use client';

import { useEffect, useRef, useState } from 'react';
import { useOnboarding } from './OnboardingProvider';

type StepKey = 'permission' | 'detecting' | 'details' | 'preparing';
type StepStatus = 'pending' | 'active' | 'done' | 'error';

const STEP_CONFIG: { key: StepKey; icon: string; title: string }[] = [
  { key: 'permission', icon: 'fa-location-arrow', title: 'Requesting location permission' },
  { key: 'detecting', icon: 'fa-bullseye', title: 'Detecting your current location' },
  { key: 'details', icon: 'fa-location-dot', title: 'Finding address details' },
  { key: 'preparing', icon: 'fa-house', title: 'Preparing your delivery address' },
];

export default function LocationDetectionScreen() {
  const { navigateTo, setAddress } = useOnboarding();

  const [stepStatus, setStepStatus] = useState<Record<StepKey, StepStatus>>({
    permission: 'active',
    detecting: 'pending',
    details: 'pending',
    preparing: 'pending',
  });
  const [phase, setPhase] = useState<'locating' | 'success' | 'error'>('locating');
  const [badgeText, setBadgeText] = useState('Getting location...');
  const [heading, setHeading] = useState('Getting Your Location');
  const [subheading, setSubheading] = useState(
    "We're securely getting your current location to suggest the most accurate delivery address."
  );
  const [resolvedAddress, setResolvedAddress] = useState<{ label: string; lat: number; lng: number } | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  function setStep(key: StepKey, status: StepStatus) {
    setStepStatus((prev) => ({ ...prev, [key]: status }));
  }

  async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const street = props.name || props.street || '';
        const city = props.city || props.town || props.state || '';
        return street ? `${street}, ${city}` : city || 'Detected Location';
      }
      throw new Error('No features');
    } catch {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
          headers: { 'User-Agent': 'Omekart-App-MVP' },
        });
        const data = await res.json();
        return data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : 'Detected Location';
      } catch {
        return `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    }
  }

  function runSequence() {
    clearTimers();
    setStepStatus({ permission: 'active', detecting: 'pending', details: 'pending', preparing: 'pending' });
    setPhase('locating');
    setBadgeText('Getting location...');
    setHeading('Getting Your Location');
    setSubheading("We're securely getting your current location to suggest the most accurate delivery address.");
    setResolvedAddress(null);

    if (!navigator.geolocation) {
      setStep('permission', 'error');
      setPhase('error');
      setHeading('Request Failed');
      setSubheading('Geolocation is not supported by this browser setup.');
      setBadgeText('Error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStep('permission', 'done');
        setStep('detecting', 'active');
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const t1 = setTimeout(async () => {
          setStep('detecting', 'done');
          setStep('details', 'active');
          const label = await reverseGeocode(lat, lon);
          setStep('details', 'done');
          setStep('preparing', 'active');

          const t2 = setTimeout(() => {
            setStep('preparing', 'done');
            setResolvedAddress({ label, lat, lng: lon });
            setPhase('success');
            setBadgeText('Location Confirmed');
            setHeading('Location Verified');
            setSubheading(`Your delivery point is calculated near: ${label}`);
          }, 1000);
          timers.current.push(t2);
        }, 1200);
        timers.current.push(t1);
      },
      (error) => {
        console.error(error);
        setStep('permission', 'error');
        setPhase('error');
        setHeading('Request Failed');
        setSubheading('Permission Denied. Please allow browser location permissions to proceed.');
        setBadgeText('Error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    runSequence();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConfirm() {
    if (!resolvedAddress) return;
    const cityPart = resolvedAddress.label.split(',').pop()?.trim() || 'Lagos';
    setAddress({
      street: resolvedAddress.label,
      city: cityPart,
      lat: resolvedAddress.lat,
      lng: resolvedAddress.lng,
    });
    navigateTo('delivery-address');
  }

  const mapStyle =
    phase === 'success' && resolvedAddress
      ? {
          backgroundImage: `url('https://maps.wikimedia.org/osm-intl/15/${resolvedAddress.lng}/${resolvedAddress.lat}/450x240.png?lang=en')`,
          backgroundSize: 'cover' as const,
        }
      : {};

  return (
    <section className="flex flex-col flex-1 py-2 px-0 bg-white overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 px-6">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => navigateTo('location-services')}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-100" />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-100" />
            <div className="w-5 h-1.5 rounded-full bg-violet-600" />
          </div>
        </div>

        <div
          className="w-full h-40 rounded-[24px] relative overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-100 bg-[#F9FAFB]"
          style={{
            backgroundImage:
              mapStyle.backgroundImage ??
              'linear-gradient(90deg, rgba(243,244,246,0.7) 1px, transparent 1px), linear-gradient(rgba(243,244,246,0.7) 1px, transparent 1px)',
            backgroundSize: mapStyle.backgroundSize ?? '40px 40px',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-slate-500 flex items-center gap-1.5 shadow-sm z-10">
            {phase === 'success' ? (
              <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }} />
            ) : phase === 'error' ? (
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#EF4444' }} />
            ) : (
              <i className="fa-solid fa-spinner animate-spin text-violet-600" />
            )}
            <span>{badgeText}</span>
          </div>

          {phase === 'locating' && (
            <>
              <span className="absolute w-[210px] h-[210px] rounded-full border border-dashed border-violet-500/15 animate-ping" />
              <span className="absolute w-[126px] h-[126px] rounded-full border border-violet-500/20 bg-violet-500/5 animate-ping" />
              <div className="w-4 h-4 bg-violet-600 rounded-full border-[3px] border-white shadow-lg shadow-violet-600/40 z-10" />
            </>
          )}
        </div>

        <div className="text-center mb-2 mt-3 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">{heading}</h1>
          <p className="text-[13px] text-slate-500 leading-snug px-2">{subheading}</p>
        </div>

        <div className="flex flex-col gap-2.5 bg-white border border-slate-100 rounded-2xl px-4 py-3 mb-2 flex-shrink-0">
          {STEP_CONFIG.map((s) => {
            const status = stepStatus[s.key];
            return (
              <div
                key={s.key}
                className={`flex items-center justify-between transition-opacity duration-300 ${
                  status === 'pending' ? 'opacity-35' : 'opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 flex justify-center text-violet-600 text-base">
                    <i className={`fa-solid ${s.icon}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-800">{s.title}</span>
                </div>
                <div className="text-[13px] text-slate-400">
                  {status === 'active' && <i className="fa-solid fa-spinner animate-spin text-violet-600" />}
                  {status === 'done' && <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }} />}
                  {status === 'error' && <i className="fa-solid fa-circle-xmark" style={{ color: '#EF4444' }} />}
                  {status === 'pending' && <i className="fa-solid fa-circle text-[7px] text-slate-300" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-500 text-center justify-center mb-2 px-2 flex-shrink-0">
          <i className="fa-solid fa-shield-halved text-violet-600 mt-0.5" />
          <span>Your location is only used to improve delivery accuracy and is never shared.</span>
        </div>

        <button
          disabled={phase === 'locating'}
          onClick={phase === 'success' ? handleConfirm : phase === 'error' ? runSequence : undefined}
          className={`w-full py-3.5 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2.5 flex-shrink-0 transition-all ${
            phase === 'locating'
              ? 'bg-[#EFE9FE] text-[#A78BFA] cursor-not-allowed'
              : 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 cursor-pointer'
          }`}
        >
          <span>
            {phase === 'locating' ? 'Locating...' : phase === 'error' ? 'Retry Connection' : 'Confirm Delivery Address'}
          </span>
          {phase === 'locating' && <i className="fa-solid fa-spinner animate-spin" />}
        </button>
      </div>
    </section>
  );
}