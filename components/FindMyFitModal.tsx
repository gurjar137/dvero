'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Product,
  BodyType,
  Gender,
  PreferredRise,
  FitPreference,
  CurrentFitFeedback,
  FitProfile,
  FitResult,
} from '@/lib/types';
import { computeFit, getFitCategoryConfig } from '@/lib/FindMyFitEngine';
import { useFitProfile } from '@/lib/useFitProfile';

type FindMyFitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  stockFor?: (id: string, size: string) => number;
  onSelectSize?: (size: string) => void;
};

type TabType = 'recommend' | 'chart' | 'measure';

export function FindMyFitModal({
  isOpen,
  onClose,
  product,
  stockFor,
  onSelectSize,
}: FindMyFitModalProps) {
  const { profile, saveProfile } = useFitProfile();

  // Derive config strictly for current product
  const config = useMemo(() => {
    if (product) {
      return getFitCategoryConfig(product);
    }
    return getFitCategoryConfig({
      id: 'default',
      name: 'Shirt',
      category: 'Shirts',
      type: 'shirt',
      fit_type: null,
      fit_slug: null,
      price: 0,
      fabric: null,
      cut: null,
      fit: null,
      sizes: ['S', 'M', 'L', 'XL'],
      description: null,
      care: null,
      badge: null,
      images: [],
      active: true,
    });
  }, [product?.id, product?.category, product?.type, product?.fit_slug, product?.fit_type, product?.fitCategory]);

  const isTrouser = config.garmentType === 'trouser' || product?.category?.toLowerCase() === 'trousers' || product?.type === 'trouser';

  // For Shirts: default tab is 'chart' (no recommendation engine). For Trousers: default tab is 'recommend'.
  const [activeTab, setActiveTab] = useState<TabType>(isTrouser ? 'recommend' : 'chart');

  // Form Fields (Trouser Smart Fit Assistant)
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<Gender>('male');
  const [bodyType, setBodyType] = useState<BodyType>('regular');
  const [currentWaist, setCurrentWaist] = useState<string>('');
  const [currentTrouserLength, setCurrentTrouserLength] = useState<string>('');
  const [hip, setHip] = useState<string>('');
  const [preferredRise, setPreferredRise] = useState<PreferredRise>('mid');
  const [fitPreference, setFitPreference] = useState<FitPreference>('tailored');
  const [currentFitFeedback, setCurrentFitFeedback] = useState<CurrentFitFeedback>('perfect');

  // Calculated Result
  const [result, setResult] = useState<FitResult | null>(null);
  const [calculated, setCalculated] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const stockChecker = (size: string) => {
    if (!product || !stockFor) return true;
    return stockFor(product.id, size) > 0;
  };

  // Reset & Re-compute whenever product ID or modal open state changes
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(isTrouser ? 'recommend' : 'chart');
    setCalculated(false);
    setResult(null);

    if (profile && product && isTrouser) {
      setHeightCm(profile.height_cm || 175);
      setWeightKg(profile.weight_kg || 70);
      setAge(profile.age || 28);
      setGender(profile.gender || 'male');
      setBodyType(profile.body_type || 'regular');

      if (profile.current_waist) setCurrentWaist(profile.current_waist.toString());
      if (profile.current_trouser_length) setCurrentTrouserLength(profile.current_trouser_length.toString());
      if (profile.hip) setHip(profile.hip.toString());
      if (profile.preferred_rise) setPreferredRise(profile.preferred_rise);

      if (profile.fit_preference) setFitPreference(profile.fit_preference);
      if (profile.current_fit_feedback) setCurrentFitFeedback(profile.current_fit_feedback);

      const computed = computeFit(profile, product, stockChecker);
      setResult(computed);
      setCalculated(true);
    }
  }, [product?.id, isOpen, isTrouser]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const fitInput: FitProfile = {
      height_cm: Number(heightCm),
      weight_kg: Number(weightKg),
      age: Number(age),
      gender,
      body_type: bodyType,

      current_waist: currentWaist ? Number(currentWaist) : undefined,
      current_trouser_length: currentTrouserLength ? Number(currentTrouserLength) : undefined,
      hip: hip ? Number(hip) : undefined,
      preferred_rise: preferredRise,

      fit_preference: fitPreference,
      current_fit_feedback: currentFitFeedback,
    };

    const res = computeFit(fitInput, product, stockChecker);
    setResult(res);
    setCalculated(true);

    await saveProfile(fitInput);
    setIsSaving(false);
  };

  const handleApplySize = () => {
    if (!result || !onSelectSize) return;
    onSelectSize(result.appliedSize);
    onClose();
  };

  const chartHeaders = config.sizeChart.length > 0 ? Object.keys(config.sizeChart[0]) : [];

  return (
    <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-bg border border-line rounded-lg shadow-2xl max-w-2xl w-full p-5 sm:p-7 relative animate-fadeIn max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-line">
          <div>
            <span className="font-oswald text-[0.65rem] tracking-widest uppercase text-camelDeep block mb-0.5">
              Category: {config.name} ({isTrouser ? 'Trouser' : 'Shirt'})
            </span>
            <h2 className="font-oswald text-2xl uppercase text-ink tracking-tight flex items-center gap-2">
              <span>{isTrouser ? '📏 Find My Fit' : '📏 Shirt Size Chart & Guide'}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-mute hover:text-ink font-oswald text-sm uppercase tracking-wider min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-panel transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-line mt-4 mb-5">
          {/* Trouser Only: Find My Fit Recommendation Tab */}
          {isTrouser && (
            <button
              onClick={() => setActiveTab('recommend')}
              className={`flex-1 py-2.5 font-oswald text-xs uppercase tracking-wider border-b-2 transition-all min-h-[44px] ${
                activeTab === 'recommend'
                  ? 'border-ink text-ink font-medium'
                  : 'border-transparent text-mute hover:text-ink'
              }`}
            >
              Find My Fit
            </button>
          )}

          {/* Size Chart Tab */}
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-2.5 font-oswald text-xs uppercase tracking-wider border-b-2 transition-all min-h-[44px] ${
              activeTab === 'chart'
                ? 'border-ink text-ink font-medium'
                : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            {isTrouser ? `Trouser Size Chart (${config.name})` : `Shirt Size Chart (${config.name})`}
          </button>

          {/* How to Measure Tab */}
          <button
            onClick={() => setActiveTab('measure')}
            className={`flex-1 py-2.5 font-oswald text-xs uppercase tracking-wider border-b-2 transition-all min-h-[44px] ${
              activeTab === 'measure'
                ? 'border-ink text-ink font-medium'
                : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            How to Measure
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="overflow-y-auto pr-1 flex-1 scrollbar-none space-y-5">
          {/* TAB 1: TROUSER SMART FIT ASSISTANT (TROUSERS ONLY) */}
          {isTrouser && activeTab === 'recommend' && (
            <div className="space-y-6">
              <form onSubmit={handleCalculate} className="space-y-5">
                {/* 1. Core Profile Questions */}
                <div className="bg-panel/60 border border-line p-4 rounded-sm space-y-4">
                  <span className="font-oswald text-xs uppercase tracking-widest text-camelDeep block">
                    1. Profile & Build
                  </span>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-oswald text-[0.68rem] uppercase tracking-wider text-mute mb-1">
                        Height (cm) *
                      </label>
                      <input
                        type="number"
                        min="120"
                        max="230"
                        required
                        value={heightCm}
                        onChange={e => setHeightCm(Number(e.target.value))}
                        className="w-full bg-bg border border-line rounded-sm px-3 py-2 font-mono text-sm text-ink outline-none focus:border-ink transition-colors min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block font-oswald text-[0.68rem] uppercase tracking-wider text-mute mb-1">
                        Weight (kg) *
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="160"
                        required
                        value={weightKg}
                        onChange={e => setWeightKg(Number(e.target.value))}
                        className="w-full bg-bg border border-line rounded-sm px-3 py-2 font-mono text-sm text-ink outline-none focus:border-ink transition-colors min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block font-oswald text-[0.68rem] uppercase tracking-wider text-mute mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        min="14"
                        max="100"
                        required
                        value={age}
                        onChange={e => setAge(Number(e.target.value))}
                        className="w-full bg-bg border border-line rounded-sm px-3 py-2 font-mono text-sm text-ink outline-none focus:border-ink transition-colors min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-oswald text-[0.68rem] uppercase tracking-wider text-mute mb-1.5">
                        Gender *
                      </label>
                      <div className="flex gap-1.5">
                        {(['male', 'female', 'unisex'] as Gender[]).map(g => (
                          <button
                            type="button"
                            key={g}
                            onClick={() => setGender(g)}
                            className={`flex-1 py-1.5 font-oswald text-[0.68rem] tracking-wider uppercase border rounded-sm transition-all min-h-[36px] ${
                              gender === g
                                ? 'bg-ink text-bg border-ink'
                                : 'bg-bg border-line text-mute hover:text-ink'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-oswald text-[0.68rem] uppercase tracking-wider text-mute mb-1.5">
                        Body Type *
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['slim', 'regular', 'athletic', 'heavy'] as BodyType[]).map(b => (
                          <button
                            type="button"
                            key={b}
                            onClick={() => setBodyType(b)}
                            className={`py-1.5 px-2 font-oswald text-[0.68rem] tracking-wider uppercase border rounded-sm transition-all min-h-[36px] capitalize ${
                              bodyType === b
                                ? 'bg-ink text-bg border-ink'
                                : 'bg-bg border-line text-mute hover:text-ink'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Fit Feedback */}
                <div className="bg-panel/60 border border-line p-4 rounded-sm space-y-3">
                  <span className="font-oswald text-xs uppercase tracking-widest text-camelDeep block">
                    2. Fit Feedback
                  </span>
                  <label className="block text-xs font-inter text-ink">
                    How do your current trousers usually fit?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'too_tight', label: 'Too Tight' },
                      { id: 'perfect', label: 'Perfect' },
                      { id: 'too_loose', label: 'Too Loose' },
                    ].map(item => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setCurrentFitFeedback(item.id as CurrentFitFeedback)}
                        className={`py-2 px-3 rounded-sm font-oswald text-xs tracking-wider uppercase border transition-all min-h-[40px] ${
                          currentFitFeedback === item.id
                            ? 'bg-ink text-bg border-ink shadow-xs'
                            : 'bg-bg border-line text-mute hover:border-ink hover:text-ink'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Trouser Measurements */}
                <div className="bg-panel/60 border border-line p-4 rounded-sm space-y-3">
                  <span className="font-oswald text-xs uppercase tracking-widest text-camelDeep block">
                    3. Trouser Measurements (Optional)
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block font-oswald text-[0.65rem] uppercase text-mute mb-1">
                        Current Waist (in)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 32"
                        value={currentWaist}
                        onChange={e => setCurrentWaist(e.target.value)}
                        className="w-full bg-bg border border-line rounded-sm px-2 py-1.5 font-mono text-xs text-ink outline-none min-h-[36px]"
                      />
                    </div>
                    <div>
                      <label className="block font-oswald text-[0.65rem] uppercase text-mute mb-1">
                        Trouser Length (in)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 40"
                        value={currentTrouserLength}
                        onChange={e => setCurrentTrouserLength(e.target.value)}
                        className="w-full bg-bg border border-line rounded-sm px-2 py-1.5 font-mono text-xs text-ink outline-none min-h-[36px]"
                      />
                    </div>
                    <div>
                      <label className="block font-oswald text-[0.65rem] uppercase text-mute mb-1">
                        Hip (in)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 40"
                        value={hip}
                        onChange={e => setHip(e.target.value)}
                        className="w-full bg-bg border border-line rounded-sm px-2 py-1.5 font-mono text-xs text-ink outline-none min-h-[36px]"
                      />
                    </div>
                    <div>
                      <label className="block font-oswald text-[0.65rem] uppercase text-mute mb-1">
                        Rise
                      </label>
                      <select
                        value={preferredRise}
                        onChange={e => setPreferredRise(e.target.value as PreferredRise)}
                        className="w-full bg-bg border border-line rounded-sm px-1 py-1.5 font-oswald text-xs uppercase text-ink outline-none min-h-[36px]"
                      >
                        <option value="low">Low</option>
                        <option value="mid">Mid</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-ink text-bg font-oswald text-xs tracking-widest uppercase py-3.5 rounded-sm hover:bg-camelDeep transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow-sm2"
                >
                  {isSaving ? 'Calculating...' : `Calculate Size for ${config.name}`}
                </button>
              </form>

              {/* TROUSER RECOMMENDATION OUTPUT CARD */}
              {calculated && result && (
                <div className="bg-panel border border-line rounded-md p-5 animate-fadeIn space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <span className="font-oswald text-[0.65rem] uppercase tracking-widest text-camelDeep">
                        D&apos;VERO Tailored Recommendation
                      </span>
                      <h3 className="font-oswald text-lg uppercase text-ink">
                        Recommended Trouser Size
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 bg-bg px-3 py-1.5 rounded-full border border-line shadow-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                      <span className="font-oswald text-xs tracking-wider uppercase text-ink">
                        {result.confidence}% Match
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-bg p-3 rounded border border-line">
                      <div className="font-oswald text-[0.62rem] tracking-wider uppercase text-mute mb-1">
                        Trouser Waist
                      </div>
                      <div className="font-oswald text-2xl font-bold text-ink">
                        {result.trouserWaist}&quot;
                      </div>
                      {result.isNearestAvailable && (
                        <span className="font-oswald text-[0.6rem] text-amber-700 uppercase block mt-0.5">
                          ({result.appliedSize}&quot; In-Stock)
                        </span>
                      )}
                    </div>

                    <div className="bg-bg p-3 rounded border border-line">
                      <div className="font-oswald text-[0.62rem] tracking-wider uppercase text-mute mb-1">
                        Trouser Length
                      </div>
                      <div className="font-oswald text-xs font-semibold text-ink pt-1.5 truncate">
                        {result.trouserLength}
                      </div>
                    </div>

                    <div className="bg-bg p-3 rounded border border-line">
                      <div className="font-oswald text-[0.62rem] tracking-wider uppercase text-mute mb-1">
                        Trouser Fit
                      </div>
                      <div className="font-oswald text-xs font-semibold text-camelDeep pt-1.5 truncate">
                        {result.trouserFit}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-mute font-inter text-center">
                    {result.explanation}
                  </p>

                  {result.sizeSuggestion && (
                    <div className="bg-bg p-3 rounded border border-line text-xs font-inter text-ink text-center">
                      💡 {result.sizeSuggestion}
                    </div>
                  )}

                  <button
                    onClick={handleApplySize}
                    className="w-full bg-camel text-ink hover:bg-camelDeep hover:text-bg font-oswald text-xs tracking-widest uppercase py-3.5 rounded-sm transition-colors min-h-[44px]"
                  >
                    Auto-Select Size ({result.appliedSize}) in Size Selector
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIZE CHART (SHIRT CHART FOR SHIRTS, TROUSER CHART FOR TROUSERS) */}
          {activeTab === 'chart' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-oswald text-sm uppercase text-ink tracking-wider">
                {config.name} Official Size Chart
              </h4>
              <div className="overflow-x-auto border border-line rounded-sm">
                <table className="w-full text-xs text-left font-inter">
                  <thead className="bg-panel font-oswald text-[0.68rem] uppercase text-ink border-b border-line">
                    <tr>
                      {chartHeaders.map(h => (
                        <th key={h} className="p-2.5 capitalize">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-mute">
                    {config.sizeChart.map((row, idx) => (
                      <tr key={idx} className="hover:bg-panel/50">
                        {chartHeaders.map(h => (
                          <td
                            key={h}
                            className={`p-2.5 ${h === 'size' || h === 'waist' ? 'font-oswald font-medium text-ink' : ''}`}
                          >
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HOW TO MEASURE (CATEGORY SPECIFIC) */}
          {activeTab === 'measure' && (
            <div className="space-y-4 animate-fadeIn text-sm text-mute">
              <div className="border border-line p-4 rounded-sm bg-panel space-y-3">
                {!isTrouser ? (
                  <>
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-ink text-bg font-oswald text-xs flex items-center justify-center flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h5 className="font-oswald text-xs uppercase tracking-wider text-ink">
                          Chest / Bust
                        </h5>
                        <p className="text-xs text-mute mt-0.5">
                          Measure around the fullest part of your chest, keeping the tape measure horizontal under your arms.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-line">
                      <div className="w-7 h-7 rounded-full bg-ink text-bg font-oswald text-xs flex items-center justify-center flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h5 className="font-oswald text-xs uppercase tracking-wider text-ink">
                          Shoulder Width
                        </h5>
                        <p className="text-xs text-mute mt-0.5">
                          Measure across the back from the tip of one shoulder seam to the tip of the opposite shoulder.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-ink text-bg font-oswald text-xs flex items-center justify-center flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h5 className="font-oswald text-xs uppercase tracking-wider text-ink">
                          Natural Waist
                        </h5>
                        <p className="text-xs text-mute mt-0.5">
                          Wrap the tape around your natural waistline, where your trousers comfortably sit.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-line">
                      <div className="w-7 h-7 rounded-full bg-ink text-bg font-oswald text-xs flex items-center justify-center flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h5 className="font-oswald text-xs uppercase tracking-wider text-ink">
                          Trouser Length
                        </h5>
                        <p className="text-xs text-mute mt-0.5">
                          Measure from your waistband down along the outside of your leg to where you want the hem to break over your shoe (full length in inches).
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-line flex justify-between items-center text-[0.65rem] font-oswald text-mute uppercase tracking-wider">
          <span>D&apos;VERO Tailoring Intelligence</span>
          <span>Official {config.name} Guide</span>
        </div>
      </div>
    </div>
  );
}
