export type Granularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface RevenueSummary {
  grossRevenue: number;
  netRevenue: number;
  totalBookings: number;
  totalTips: number;
  totalPlatformFees: number;
  totalRefunds: number;
  averageOrderValue: number;
}

export interface BarberRevenue {
  barberId: string;
  barberName: string;
  grossRevenue: number;
  netRevenue: number;
  totalTips: number;
  totalPlatformFees: number;
  bookingCount: number;
  averageOrderValue: number;
  tipsToRevenueRatio: number;
}

export interface ServiceRevenue {
  serviceId: string;
  serviceName: string;
  grossRevenue: number;
  netRevenue: number;
  bookingCount: number;
  averagePrice: number;
  durationMinutes: number;
  revenuePerMinute: number;
}

export interface PeriodRevenue {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  totalTips: number;
  totalPlatformFees: number;
  bookingCount: number;
}

export interface BookingCounts {
  total: number;
  completed: number;
  canceled: number;
  noShow: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

export interface TopPerformers {
  topBarber: { barberId: string; barberName: string; grossRevenue: number } | null;
  topService: { serviceId: string; serviceName: string; bookingCount: number } | null;
}

export interface TodayStats {
  revenue: number;
  bookingCount: number;
  tips: number;
}

export interface PeriodComparison {
  current: RevenueSummary;
  previous: RevenueSummary;
  growthRate: number;
  revenueChange: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageBookingsPerCustomer: number;
  topCustomers: {
    clientId: string;
    clientName: string;
    totalRevenue: number;
    bookingCount: number;
  }[];
  retentionRate: number;
  churnedCustomers: number;
}

export interface CapacityMetrics {
  barberId: string;
  barberName: string;
  totalAvailableMinutes: number;
  totalBookedMinutes: number;
  utilizationRate: number;
  lostRevenue: number;
}

export interface IFinanceAnalyticsRepository {
  getRevenueSummary(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<RevenueSummary>;

  getRevenueByBarber(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BarberRevenue[]>;

  getRevenueByService(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ServiceRevenue[]>;

  getRevenueByPeriod(
    establishmentId: string | undefined,
    granularity: Granularity,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PeriodRevenue[]>;

  getBookingCounts(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BookingCounts>;

  getTopPerformers(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopPerformers>;

  getTodayStats(establishmentId?: string): Promise<TodayStats>;

  getCustomerMetrics(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<CustomerMetrics>;
}

export const FINANCE_ANALYTICS_REPOSITORY = Symbol('FINANCE_ANALYTICS_REPOSITORY');
