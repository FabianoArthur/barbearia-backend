import { Inject, Injectable } from '@nestjs/common';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type IFinanceAnalyticsRepository,
  type RevenueSummary,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { ExportFormat, ReportType } from '../../presentation/dtos/report-export-query.dto';

interface ExportResult {
  data: string;
  contentType: string;
  filename: string;
}

@Injectable()
export class ReportExportService {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
  ) {}

  async export(
    establishmentId: string | undefined,
    format: ExportFormat,
    reportType: ReportType,
    startDate?: string,
    endDate?: string,
  ): Promise<ExportResult> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (reportType) {
      case 'revenue':
        return this.exportRevenue(establishmentId, format, start, end, timestamp);
      case 'barber':
        return this.exportBarber(establishmentId, format, start, end, timestamp);
      case 'service':
        return this.exportService(establishmentId, format, start, end, timestamp);
      case 'customer':
        return this.exportCustomer(establishmentId, format, start, end, timestamp);
      case 'tax':
        return this.exportTax(establishmentId, format, start, end, timestamp);
    }
  }

  private async exportRevenue(
    establishmentId: string | undefined,
    format: ExportFormat,
    start?: Date,
    end?: Date,
    timestamp?: string,
  ): Promise<ExportResult> {
    const [summary, byPeriod] = await Promise.all([
      this.analyticsRepo.getRevenueSummary(establishmentId, start, end),
      this.analyticsRepo.getRevenueByPeriod(establishmentId, 'month', start, end),
    ]);

    if (format === 'csv') {
      const header = 'Period,Gross Revenue,Net Revenue,Tips,Platform Fees,Bookings';
      const rows = byPeriod.map(
        (p) =>
          `${p.period},${p.grossRevenue},${p.netRevenue},${p.totalTips},${p.totalPlatformFees},${p.bookingCount}`,
      );
      const summaryRow = `Total,${summary.grossRevenue},${summary.netRevenue},${summary.totalTips},${summary.totalPlatformFees},${summary.totalBookings}`;

      return {
        data: [header, ...rows, '', summaryRow].join('\n'),
        contentType: 'text/csv',
        filename: `revenue-report-${timestamp}.csv`,
      };
    }

    return {
      data: JSON.stringify({ summary, byPeriod }, null, 2),
      contentType: 'application/json',
      filename: `revenue-report-${timestamp}.json`,
    };
  }

  private async exportBarber(
    establishmentId: string | undefined,
    format: ExportFormat,
    start?: Date,
    end?: Date,
    timestamp?: string,
  ): Promise<ExportResult> {
    const barbers = await this.analyticsRepo.getRevenueByBarber(establishmentId, start, end);

    if (format === 'csv') {
      const header =
        'Barber,Gross Revenue,Net Revenue,Tips,Platform Fees,Bookings,Avg Order,Tips Ratio';
      const rows = barbers.map(
        (b) =>
          `${b.barberName},${b.grossRevenue},${b.netRevenue},${b.totalTips},${b.totalPlatformFees},${b.bookingCount},${b.averageOrderValue.toFixed(2)},${(b.tipsToRevenueRatio * 100).toFixed(1)}%`,
      );

      return {
        data: [header, ...rows].join('\n'),
        contentType: 'text/csv',
        filename: `barber-report-${timestamp}.csv`,
      };
    }

    return {
      data: JSON.stringify({ barbers }, null, 2),
      contentType: 'application/json',
      filename: `barber-report-${timestamp}.json`,
    };
  }

  private async exportService(
    establishmentId: string | undefined,
    format: ExportFormat,
    start?: Date,
    end?: Date,
    timestamp?: string,
  ): Promise<ExportResult> {
    const services = await this.analyticsRepo.getRevenueByService(establishmentId, start, end);

    if (format === 'csv') {
      const header = 'Service,Gross Revenue,Net Revenue,Bookings,Avg Price,Duration (min),Rev/Min';
      const rows = services.map(
        (s) =>
          `${s.serviceName},${s.grossRevenue},${s.netRevenue},${s.bookingCount},${s.averagePrice.toFixed(2)},${s.durationMinutes},${s.revenuePerMinute.toFixed(2)}`,
      );

      return {
        data: [header, ...rows].join('\n'),
        contentType: 'text/csv',
        filename: `service-report-${timestamp}.csv`,
      };
    }

    return {
      data: JSON.stringify({ services }, null, 2),
      contentType: 'application/json',
      filename: `service-report-${timestamp}.json`,
    };
  }

  private async exportCustomer(
    establishmentId: string | undefined,
    format: ExportFormat,
    start?: Date,
    end?: Date,
    timestamp?: string,
  ): Promise<ExportResult> {
    const metrics = await this.analyticsRepo.getCustomerMetrics(establishmentId, start, end, 50);

    if (format === 'csv') {
      const summaryHeader = 'Metric,Value';
      const summaryRows = [
        `Total Customers,${metrics.totalCustomers}`,
        `New Customers,${metrics.newCustomers}`,
        `Returning Customers,${metrics.returningCustomers}`,
        `Avg Bookings Per Customer,${metrics.averageBookingsPerCustomer.toFixed(2)}`,
        `Retention Rate,${(metrics.retentionRate * 100).toFixed(1)}%`,
        `Churned Customers,${metrics.churnedCustomers}`,
      ];

      const topHeader = '\nTop Customers\nName,Revenue,Bookings';
      const topRows = metrics.topCustomers.map(
        (c) => `${c.clientName},${c.totalRevenue},${c.bookingCount}`,
      );

      return {
        data: [summaryHeader, ...summaryRows, topHeader, ...topRows].join('\n'),
        contentType: 'text/csv',
        filename: `customer-report-${timestamp}.csv`,
      };
    }

    return {
      data: JSON.stringify({ metrics }, null, 2),
      contentType: 'application/json',
      filename: `customer-report-${timestamp}.json`,
    };
  }

  private async exportTax(
    establishmentId: string | undefined,
    format: ExportFormat,
    start?: Date,
    end?: Date,
    timestamp?: string,
  ): Promise<ExportResult> {
    const summary = await this.analyticsRepo.getRevenueSummary(establishmentId, start, end);

    const taxData = this.buildTaxSummary(summary);

    if (format === 'csv') {
      const header = 'Category,Amount';
      const rows = Object.entries(taxData).map(([key, value]) => `${key},${value}`);

      return {
        data: [header, ...rows].join('\n'),
        contentType: 'text/csv',
        filename: `tax-summary-${timestamp}.csv`,
      };
    }

    return {
      data: JSON.stringify(taxData, null, 2),
      contentType: 'application/json',
      filename: `tax-summary-${timestamp}.json`,
    };
  }

  private buildTaxSummary(summary: RevenueSummary): Record<string, number> {
    return {
      'Gross Revenue': summary.grossRevenue,
      'Net Revenue': summary.netRevenue,
      'Total Tips': summary.totalTips,
      'Platform Fees': summary.totalPlatformFees,
      'Refunds Issued': summary.totalRefunds,
      'Total Bookings': summary.totalBookings,
      'Average Order Value': Math.round(summary.averageOrderValue * 100) / 100,
    };
  }
}
