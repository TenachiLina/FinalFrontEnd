"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STEPS = [
  { number: 1, title: "Personal Information",  label: "Please, fill the personal information" },
  { number: 2, title: "Job Information",        label: "Fill the job information" }
];

// ─────────────────────────────────────────────
// Shared style helpers
// ─────────────────────────────────────────────
const inp =
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition";
const lbl = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function EmployeeDataForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
    else router.back();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else router.back();
  };

  const progressWidth = `${((currentStep - 1) / 3) * 100}%`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Top breadcrumb bar ── */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-200">Employees Data</span>
          <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
          <span>Employee Data Form</span>
        </p>
      </div>

      {/* ── Main content area ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/[0.06] overflow-hidden">

          {/* ── Page header ── */}
          <div className="px-8 pt-7 pb-6 border-b border-gray-100 dark:border-white/[0.06]">
            {/* Back arrow + title */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.07] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                title="Go back"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                {STEPS[currentStep - 1].title}
              </h1>
            </div>

            {/* ── Stepper ── */}
            <div className="relative flex items-start justify-between">
              {/* Base track */}
              <div
                className="absolute h-0.5 bg-blue-100 dark:bg-white/[0.08] z-0"
                style={{ top: "14px", left: "6.25%", right: "6.25%" }}
              />
              {/* Progress track */}
              <div
                className="absolute h-0.5 bg-blue-600 z-0 transition-all duration-500"
                style={{ top: "14px", left: "6.25%", width: `calc(${progressWidth} * 0.875)` }}
              />
              {STEPS.map((step) => {
                const isActive = step.number === currentStep;
                const isDone = step.number < currentStep;
                return (
                  <div key={step.number} className="flex flex-col items-center z-10 flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                        ${isActive ? "bg-blue-700 border-blue-700 text-white shadow-lg shadow-blue-200/60 dark:shadow-blue-900/40" : ""}
                        ${isDone  ? "bg-blue-500 border-blue-500 text-white" : ""}
                        ${!isActive && !isDone ? "bg-blue-50 border-blue-200 text-blue-400 dark:bg-white/[0.04] dark:border-white/[0.12] dark:text-gray-500" : ""}
                      `}
                    >
                      {isDone
                        ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : step.number
                      }
                    </div>
                    <p className={`mt-2 text-[11px] text-center leading-tight max-w-[80px] transition-colors
                      ${isActive ? "text-blue-700 dark:text-blue-400 font-semibold" : "text-gray-400 dark:text-gray-500"}
                    `}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Form body ── */}
          <div className="px-8 py-7">

            {/* STEP 1 — Personal Information */}
            {currentStep === 1 && (
              <div className="flex gap-10">
                {/* Fields */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <label className={lbl}>Employee's Number</label>
                    <input type="text" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>First Name</label>
                    <input type="text" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Last Name</label>
                    <input type="text" className={inp} />
                  </div>
                  <div>
                      <label className={lbl}>Address</label>
                      <input type="text" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Gender</label>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" checked={gender === "male"} onChange={() => setGender("male")} className="w-4 h-4 text-blue-600 focus:ring-blue-500 accent-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" checked={gender === "female"} onChange={() => setGender("female")} className="w-4 h-4 text-blue-600 focus:ring-blue-500 accent-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Female</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3 w-44 flex-shrink-0 pt-1">
                  <div
                    className="relative w-24 h-24 rounded-full bg-gray-100 dark:bg-white/[0.06] border-2 border-gray-200 dark:border-white/[0.1] overflow-hidden cursor-pointer flex items-center justify-center group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      : (
                        <svg className="w-11 h-11 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                        </svg>
                      )
                    }
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                    Please, click the camera icon to upload or change the picture.<br />
                    Image size: maximum 5 MB.<br />
                    Image format: JPG, JPEG, PNG
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2 — Job Information */}
            {currentStep === 2 && (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={lbl}>Job Title</label><input type="text" className={inp} /></div>
                  <div><label className={lbl}>Joining Date</label><input type="date" className={inp} /></div>
                </div>
                <div><label className={lbl}>Salary</label><input type="text" placeholder="$0.00" className={inp} /></div>
                <div><label className={lbl}>Work Email</label><input type="email" placeholder="employee@company.com" className={inp} /></div>
                <div><label className={lbl}>Phone Number</label><input type="tel" placeholder="+213 000 000 000" className={inp} /></div>
              </div>
            )}

            {/* STEP 3 — Family Information */}
            {currentStep === 3 && (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Marital Status</label>
                    <select className={inp}>
                      <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                    </select>
                  </div>
                  <div><label className={lbl}>Number of Children</label><input type="number" min="0" defaultValue="0" className={inp} /></div>
                </div>
                <div><label className={lbl}>Emergency Contact Name</label><input type="text" className={inp} /></div>
                <div><label className={lbl}>Emergency Contact Phone</label><input type="tel" placeholder="+213 000 000 000" className={inp} /></div>
              </div>
            )}

            {/* STEP 4 — Education Information */}
            {currentStep === 4 && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className={lbl}>Highest Degree</label>
                  <select className={inp}>
                    <option>High School</option><option>Bachelor's</option><option>Master's</option><option>PhD</option>
                  </select>
                </div>
                <div><label className={lbl}>Field of Study</label><input type="text" className={inp} /></div>
                <div><label className={lbl}>Institution Name</label><input type="text" className={inp} /></div>
                <div><label className={lbl}>Graduation Year</label><input type="number" placeholder="2024" className={inp} /></div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 dark:border-white/[0.06]">
            <p className="text-xs text-gray-400 dark:text-gray-500">Step {currentStep} of {STEPS.length}</p>
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="px-5 py-2 rounded-lg border border-gray-200 dark:border-white/[0.1] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-8 py-2 rounded-lg bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800 active:scale-[0.98] transition-all shadow-sm"
              >
                {currentStep === 2 ? "Save Employee" : "Next"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}