export type AppLanguage = 'en' | 'hi' | 'mr';

export type AppTheme = 'light' | 'dark' | 'system';

export type DevicePlatform = 'ios' | 'android' | 'responsive';

export type TabType = 'home' | 'doctor' | 'appointment' | 'profile';

export type CropGrowthStage = 'Vegetative' | 'Flowering' | 'Fruiting' | 'Harvesting';

export type TaskType = 'Spraying' | 'Irrigation' | 'Fertilization';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface CareTask {
  id: string;
  title: string;
  hindiTitle?: string;
  marathiTitle?: string;
  type: TaskType;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  notes?: string;
}

export interface CropItem {
  id: string;
  farmId?: string;
  name: string;
  hindiName?: string;
  marathiName?: string;
  variety?: string;
  acreage: number;
  plantedDate: string;
  stage: CropGrowthStage;
  stageProgress: number; // 0-100
  healthScore: number; // e.g. 98
  status: 'On track' | 'Action needed' | 'Monitoring';
  category?: 'Tomato' | 'Wheat' | 'Garden' | 'Cotton' | 'Other' | string;
  icon?: string;
  tasks: CareTask[];
}

export interface DayForecast {
  day: 'M' | 'T' | 'W' | 'T' | 'F' | 'S' | 'S';
  fullDay: string;
  status: 'optimal' | 'warning' | 'rain' | 'avoid';
  highlighted?: boolean;
  rainProbability: number;
  label: string;
}

export interface SprayAdvisory {
  id: string;
  crop: string;
  dayBadge: string;
  headline: string;
  hindiHeadline: string;
  marathiHeadline: string;
  subheadline: string;
  audioDuration: string;
  audioScript: string;
  hindiAudioScript: string;
  marathiAudioScript: string;
  rainForecastText: string;
  windSpeed: string;
  recommendedTime: string;
  optimalChemical: string;
  calendarDays: DayForecast[];
}

export interface PathologySpecimen {
  id: string;
  name: string;
  hindiName?: string;
  marathiName?: string;
  crop: string;
  scientificName: string;
  pathogenType: 'Viral' | 'Fungal' | 'Bacterial' | 'Pest' | 'Healthy';
  severity: 'Mild' | 'Moderate' | 'Severe' | 'None';
  severityScore: number;
  symptoms: string[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  preventiveMeasures: string[];
  sampleImageSvg?: string;
  description: string;
}

export interface Agronomist {
  id: string;
  name: string;
  title: string;
  hindiTitle?: string;
  qualification: string;
  institution: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  fee: number;
  specialties: ('Pest & Disease' | 'Soil Science' | 'Horticulture' | 'Organic Farming' | string)[];
  avatarInitials: string;
  avatarBg?: string;
  isAvailableToday: boolean;
  nextSlot: string;
  languages?: string[];
  consultationTypes?: ('Video Call' | 'Voice Call' | 'In-Field Visit')[];
  bio?: string;
}

export interface ConsultationBooking {
  id: string;
  agronomistId: string;
  agronomistName: string;
  agronomistTitle: string;
  date: string;
  timeSlot: string;
  type: 'Video Call' | 'Voice Call' | 'In-Field Visit';
  crop: string;
  fee: number;
  status: 'Confirmed' | 'Completed' | 'Pending';
  createdAt: string;
  notes: string;
}

export interface Farm {
  id: string;
  userId: string;
  name: string;
  location?: string;
  village?: string;
  district?: string;
  state?: string;
  totalAcreage: number;
  soilType?: string;
  crops: CropItem[];
}

export interface DiagnosticResult {
  id?: string;
  diseaseName: string;
  scientificName?: string;
  crop: string;
  pathogenType: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'None';
  severityScore: number;
  confidenceScore: number;
  symptoms: string[];
  organicRemedies: string[];
  chemicalTreatments: string[];
  preventiveMeasures: string[];
  advisoryNote?: string;
  imageUrl?: string;
}

export interface UserFarmerProfile {
  id?: string;
  name: string;
  hindiName?: string;
  email?: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
  preferredLanguage?: AppLanguage;
  totalAcreage: number;
  soilTypes?: string[];
  cropsGrown?: string[];
  offlineStorageStatus?: boolean;
  lastSyncTime?: string;
  onboardingCompleted?: boolean;
}
