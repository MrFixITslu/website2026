export interface SaaSApp {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  category: 'web' | 'desktop' | 'games' | 'courses';
  pricingType: 'free' | 'free_trial' | 'premium';
  logoUrl: string;
  accessUrl: string;
  launchCount: number;
  createdAt?: string;
  
  // Custom courses telemetry fields
  price?: number;
  rating?: number;
  instructor?: string;
  duration?: string;
  lessonsCount?: number;
  curriculum?: string;
  exam?: string;
  syllabus?: string;
}

export type CategoryFilter = 'all' | 'web' | 'desktop' | 'games' | 'courses';

export interface AppStatistics {
  totalLaunches: number;
  totalApps: number;
  webAppsCount: number;
  desktopAppsCount: number;
  gamesAppsCount: number;
  coursesAppsCount: number;
}

export interface SaaSAd {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  createdAt?: string;
}

export interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  employees: string;
  biggestChallenge: string;
  message: string;
  status: 'New' | 'Contacted' | 'Reviewed' | 'Closed';
  adminNotes: string;
  createdAt: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  author: string;
  coverImage: string;
  content?: string;
}

export type AppView = 'home' | 'about' | 'services' | 'industries' | 'solutions' | 'resources' | 'contact';
