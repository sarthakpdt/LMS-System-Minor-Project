import React, { useState } from 'react';
import {
  Calendar, GraduationCap, UserCheck, MapPin, Shield, Compass, Eye, Save,
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
} from 'lucide-react';
import ConfigPanel, { ConfigWizardStep } from './ConfigPanel';
import TimetableGenerator from './TimetableGenerator';

const SETUP_STEPS: { id: ConfigWizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'structure', label: 'Academic Structure', icon: Calendar },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'faculty', label: 'Faculty', icon: UserCheck },
  { id: 'rooms', label: 'Rooms', icon: MapPin },
  { id: 'students', label: 'Constraints', icon: Shield },
];

const GENERATOR_STEPS = [
  { id: 'generate', label: 'Generate', icon: Compass },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'save', label: 'Save', icon: Save },
] as const;

type GeneratorFocus = (typeof GENERATOR_STEPS)[number]['id'];

export default function SetupWizard() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [generatorFocus, setGeneratorFocus] = useState<GeneratorFocus>('generate');

  const totalSteps = SETUP_STEPS.length + GENERATOR_STEPS.length;
  const isGeneratorPhase = step >= SETUP_STEPS.length;

  const markComplete = (index: number) => {
    setCompleted((prev) => ({ ...prev, [index]: true }));
  };

  const goNext = () => {
    markComplete(step);
    if (step < totalSteps - 1) {
      const next = step + 1;
      setStep(next);
      if (next >= SETUP_STEPS.length) {
        const genIdx = next - SETUP_STEPS.length;
        setGeneratorFocus(GENERATOR_STEPS[genIdx]?.id || 'generate');
      }
    }
  };

  const goBack = () => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      if (prev >= SETUP_STEPS.length) {
        const genIdx = prev - SETUP_STEPS.length;
        setGeneratorFocus(GENERATOR_STEPS[genIdx]?.id || 'generate');
      }
    }
  };

  const goToStep = (index: number) => {
    setStep(index);
    if (index >= SETUP_STEPS.length) {
      const genIdx = index - SETUP_STEPS.length;
      setGeneratorFocus(GENERATOR_STEPS[genIdx]?.id || 'generate');
    }
  };

  const allSteps = [
    ...SETUP_STEPS.map((s) => ({ ...s, phase: 'setup' as const })),
    ...GENERATOR_STEPS.map((s) => ({ ...s, phase: 'generator' as const })),
  ];

  return (
    <div className="space-y-6">
      {/* Progress stepper */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {allSteps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === idx;
            const isDone = completed[idx] || idx < step;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md'
                      : isDone
                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                        : 'bg-gray-50 text-gray-500 border border-gray-100 hover:border-purple-200'
                  }`}
                >
                  {isDone && !isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  <span>{idx + 1}. {s.label}</span>
                </button>
                {idx < allSteps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
            Step {step + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {!isGeneratorPhase ? (
          <ConfigPanel
            embeddedStep={SETUP_STEPS[step].id}
            hideHeader
            onStructureSaved={() => markComplete(step)}
          />
        ) : (
          <TimetableGenerator focusStep={generatorFocus} embedded />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          {allSteps.map((_, idx) => (
            <Circle
              key={idx}
              className={`w-2 h-2 ${idx === step ? 'text-purple-600 fill-purple-600' : idx < step ? 'text-emerald-400 fill-emerald-400' : 'text-gray-300'}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={step >= totalSteps - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition shadow-sm"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
