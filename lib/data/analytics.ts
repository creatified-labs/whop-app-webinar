/**
 * Analytics Data Functions
 * Functions for fetching analytics data
 */

import { createAdminClient } from '@/lib/supabase/server';

export type DateRange = '7d' | '30d' | '90d' | 'all';

function getDateRangeFilter(dateRange: DateRange): Date | null {
  if (dateRange === 'all') return null;

  const now = new Date();
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export interface CompanyStats {
  totalRegistrations: number;
  totalAttendees: number;
  avgAttendanceRate: number;
  totalWebinars: number;
}

/**
 * Get aggregate stats for a company
 */
export async function getCompanyStats(
  companyId: string,
  dateRange: DateRange = '30d'
): Promise<CompanyStats> {
  const supabase = createAdminClient();
  const startDate = getDateRangeFilter(dateRange);

  // Get webinar IDs for this company within date range
  let webinarQuery = supabase
    .from('webinars')
    .select('id')
    .eq('company_id', companyId);

  if (startDate) {
    webinarQuery = webinarQuery.gte('created_at', startDate.toISOString());
  }

  const { data: webinars, error: webinarError } = await webinarQuery;

  if (webinarError) {
    throw new Error(`Failed to get webinars: ${webinarError.message}`);
  }

  const webinarIds = webinars.map((w) => w.id);
  const totalWebinars = webinarIds.length;

  if (webinarIds.length === 0) {
    return {
      totalRegistrations: 0,
      totalAttendees: 0,
      avgAttendanceRate: 0,
      totalWebinars: 0,
    };
  }

  // Get registration stats
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select('attended')
    .in('webinar_id', webinarIds);

  if (regError) {
    throw new Error(`Failed to get registrations: ${regError.message}`);
  }

  const totalRegistrations = registrations.length;
  const totalAttendees = registrations.filter((r) => r.attended).length;
  const avgAttendanceRate = totalRegistrations > 0
    ? Math.round((totalAttendees / totalRegistrations) * 100)
    : 0;

  return {
    totalRegistrations,
    totalAttendees,
    avgAttendanceRate,
    totalWebinars,
  };
}

export interface RegistrationTrendPoint {
  date: string;
  count: number;
}

/**
 * Get registration trends over time
 */
export async function getRegistrationTrends(
  companyId: string,
  dateRange: DateRange = '30d'
): Promise<RegistrationTrendPoint[]> {
  const supabase = createAdminClient();
  const startDate = getDateRangeFilter(dateRange);

  // Get webinar IDs for this company
  const { data: webinars, error: webinarError } = await supabase
    .from('webinars')
    .select('id')
    .eq('company_id', companyId);

  if (webinarError) {
    throw new Error(`Failed to get webinars: ${webinarError.message}`);
  }

  const webinarIds = webinars.map((w) => w.id);

  if (webinarIds.length === 0) {
    return [];
  }

  // Get registrations with dates
  let regQuery = supabase
    .from('registrations')
    .select('created_at')
    .in('webinar_id', webinarIds)
    .order('created_at', { ascending: true });

  if (startDate) {
    regQuery = regQuery.gte('created_at', startDate.toISOString());
  }

  const { data: registrations, error: regError } = await regQuery;

  if (regError) {
    throw new Error(`Failed to get registrations: ${regError.message}`);
  }

  // Group by date
  const countsByDate: Record<string, number> = {};
  registrations.forEach((reg) => {
    const date = new Date(reg.created_at).toISOString().split('T')[0];
    countsByDate[date] = (countsByDate[date] || 0) + 1;
  });

  // Fill in missing dates
  const result: RegistrationTrendPoint[] = [];
  const endDate = new Date();
  const currentDate = startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: countsByDate[dateStr] || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

export interface WebinarPerformance {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  registrations: number;
  attendees: number;
  attendanceRate: number;
}

/**
 * Get performance metrics for each webinar
 */
export async function getWebinarPerformance(
  companyId: string,
  options?: {
    dateRange?: DateRange;
    limit?: number;
    sortBy?: 'registrations' | 'attendees' | 'rate' | 'date';
  }
): Promise<WebinarPerformance[]> {
  const supabase = createAdminClient();
  const dateRange = options?.dateRange || '30d';
  const startDate = getDateRangeFilter(dateRange);
  const limit = options?.limit || 10;

  // Get webinars with registration counts
  let webinarQuery = supabase
    .from('webinars')
    .select(`
      id,
      title,
      status,
      scheduled_at,
      registrations(attended)
    `)
    .eq('company_id', companyId)
    .order('scheduled_at', { ascending: false })
    .limit(limit);

  if (startDate) {
    webinarQuery = webinarQuery.gte('created_at', startDate.toISOString());
  }

  const { data: webinars, error } = await webinarQuery;

  if (error) {
    throw new Error(`Failed to get webinar performance: ${error.message}`);
  }

  return webinars.map((webinar) => {
    const registrations = webinar.registrations as { attended: boolean }[];
    const totalRegs = registrations.length;
    const totalAttendees = registrations.filter((r) => r.attended).length;
    const attendanceRate = totalRegs > 0
      ? Math.round((totalAttendees / totalRegs) * 100)
      : 0;

    return {
      id: webinar.id,
      title: webinar.title,
      status: webinar.status,
      scheduledAt: webinar.scheduled_at,
      registrations: totalRegs,
      attendees: totalAttendees,
      attendanceRate,
    };
  });
}

export interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

/**
 * Get traffic source breakdown
 */
export async function getTrafficSources(
  companyId: string,
  dateRange: DateRange = '30d'
): Promise<TrafficSource[]> {
  const supabase = createAdminClient();
  const startDate = getDateRangeFilter(dateRange);

  // Get webinar IDs for this company
  const { data: webinars, error: webinarError } = await supabase
    .from('webinars')
    .select('id')
    .eq('company_id', companyId);

  if (webinarError) {
    throw new Error(`Failed to get webinars: ${webinarError.message}`);
  }

  const webinarIds = webinars.map((w) => w.id);

  if (webinarIds.length === 0) {
    return [];
  }

  // Get registrations with sources
  let regQuery = supabase
    .from('registrations')
    .select('source')
    .in('webinar_id', webinarIds);

  if (startDate) {
    regQuery = regQuery.gte('created_at', startDate.toISOString());
  }

  const { data: registrations, error: regError } = await regQuery;

  if (regError) {
    throw new Error(`Failed to get registrations: ${regError.message}`);
  }

  // Group by source
  const countsBySource: Record<string, number> = {};
  registrations.forEach((reg) => {
    const source = reg.source || 'Direct';
    countsBySource[source] = (countsBySource[source] || 0) + 1;
  });

  const total = registrations.length;

  // Convert to array and sort by count
  return Object.entries(countsBySource)
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
