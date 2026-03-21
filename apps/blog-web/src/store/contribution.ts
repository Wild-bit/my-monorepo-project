import { create } from 'zustand';

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ApiResponse {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

interface ContributionWeek {
  days: ContributionDay[];
}

const GITHUB_USERNAME = 'Wild-bit';
const API_BASE = 'https://github-contributions-api.jogruber.de/v4';

function groupIntoWeeks(contributions: ContributionDay[]): ContributionWeek[] {
  const weeks: ContributionWeek[] = [];
  let currentWeek: ContributionDay[] = [];

  if (contributions.length > 0) {
    const firstDay = new Date(contributions[0]!.date).getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: '', count: 0, level: 0 });
    }
  }

  for (const day of contributions) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek });
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', count: 0, level: 0 });
    }
    weeks.push({ days: currentWeek });
  }

  return weeks;
}

interface ContributionStore {
  weeks: ContributionWeek[];
  total: number;
  loading: boolean;
  fetched: boolean;
  fetchContributions: () => Promise<void>;
}

export const useContributionStore = create<ContributionStore>((set, get) => ({
  weeks: [],
  total: 0,
  loading: false,
  fetched: false,
  fetchContributions: async () => {
    if (get().fetched) return;
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/${GITHUB_USERNAME}?y=last`);
      const data: ApiResponse = await res.json();
      set({
        weeks: groupIntoWeeks(data.contributions),
        total: data.total['lastYear'] ?? 0,
        fetched: true,
      });
    } catch {
      set({ fetched: true });
    } finally {
      set({ loading: false });
    }
  },
}));

export type { ContributionDay, ContributionWeek };
