"use client";

import React from "react";
import { Check, Bell, ChevronDown } from "lucide-react";
import { useClipStore } from "@/stores/clipStore";

const STEPS = [
  { id: 1, label: "Import Video" },
  { id: 2, label: "Select Clips" },
  { id: 3, label: "AI Captions" },
  { id: 4, label: "Customize" },
  { id: 5, label: "Export" },
];

export default function Header() {
  const { currentStep, setStep, videoMetadata, clips } = useClipStore();

  const handleStepClick = (stepId: number) => {
    // Can only navigate to steps if prerequisites are met
    if (stepId === 1) {
      setStep(1);
    } else if (stepId === 2 && videoMetadata) {
      setStep(2);
    } else if (stepId >= 3 && clips.length > 0) {
      setStep(stepId);
    }
  };

  return (
    <header className="h-20 border-b border-[#1E2138] bg-[#0E0F1D]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Invisible spacer to balance left */}
      <div className="w-48 hidden lg:block" />

      {/* Stepper Navigation */}
      <div className="flex items-center gap-4">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const canClick = step.id === 1 || (step.id === 2 && !!videoMetadata) || (step.id > 2 && clips.length > 0);

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => canClick && handleStepClick(step.id)}
                className={`flex items-center gap-2.5 transition-all select-none ${
                  canClick ? "cursor-pointer group" : "cursor-not-allowed opacity-40"
                }`}
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? "bg-purple-600 text-white purple-glow-sm scale-110 shadow-lg shadow-purple-900/40"
                      : isCompleted
                      ? "bg-[#1E213A] border border-purple-500/40 text-purple-400 group-hover:border-purple-400"
                      : "bg-[#16182B] text-gray-500 border border-[#262842]"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>

                {/* Step Label */}
                <span
                  className={`text-xs font-semibold tracking-wide transition-colors ${
                    isActive
                      ? "text-white"
                      : isCompleted
                      ? "text-gray-300 group-hover:text-white"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-[1.5px] transition-colors ${
                    currentStep > step.id ? "bg-purple-600/60" : "bg-[#1E2138]"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          title="Notifications"
          className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#181B30] transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#1E2138] cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-purple-500/30">
            AG
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">Anshul Gite</p>
            <p className="text-[10px] text-gray-400">Local User</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
}
