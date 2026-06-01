export * from "./constants/syllabus";

export interface OnboardingPayload {
  name: string;
  email: string;
  college: string;
  graduationYear: number;
  currentYear: number;
  targetRank: number;
  targetScore: number;
  currentPreparationLevel: string;
  strongSubjects: string[];
  weakSubjects: string[];
  dailyStudyTarget: number;
  coachingResources: string[];
  mockPlatforms: string[];
}

export interface OnboardingResult {
  readinessScore: number;
  estimatedRankMin: number;
  estimatedRankMax: number;
  suggestedDailyHours: number;
  preparationGapAnalysis: string;
  roadmap90Days: {
    phase: string;
    duration: string;
    focus: string;
    milestones: string[];
  }[];
}
