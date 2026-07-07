'use client';

import { CheckCircle, Upload, Eye, Sparkles, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Step } from '@/types';

interface StepConfig {
  id: Step;
  label: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  { id: 'upload', label: 'Upload', icon: <Upload className="h-4 w-4" /> },
  { id: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> },
  { id: 'confirm', label: 'Confirm', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'results', label: 'Results', icon: <BarChart3 className="h-4 w-4" /> },
];

const STEP_ORDER: Step[] = ['upload', 'preview', 'confirm', 'results'];

interface StepWizardProps {
  currentStep: Step;
}

export function StepWizard({ currentStep }: StepWizardProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-lg mx-auto">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isInactive = idx > currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Node */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={clsx(
                  'step-indicator transition-all duration-500',
                  isComplete && 'step-complete scale-90',
                  isActive && 'step-active scale-110',
                  isInactive && 'step-inactive'
                )}
              >
                {isComplete ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={clsx(
                  'text-xs font-medium transition-colors duration-300',
                  isActive && 'text-brand-400',
                  isComplete && 'text-emerald-400',
                  isInactive && 'text-white/30 dark:text-white/30'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="w-16 sm:w-24 h-px mx-2 mb-6 relative overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700 rounded-full"
                  style={{
                    width: isComplete ? '100%' : '0%',
                    background: 'linear-gradient(90deg, #10b981, #3b6ef6)',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
