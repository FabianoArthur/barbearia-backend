import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser, type JwtPayload, Roles } from '../../../../common/decorators';
import { RolesGuard } from '../../../../common/guards';
import { resolveEstablishmentId } from '../../../../common/utils/resolve-establishment';
import { BarberPerformanceQueryHandler } from '../../application/queries/barber-performance.query-handler';
import { CapacityQueryHandler } from '../../application/queries/capacity.query-handler';
import { CustomerAnalyticsQueryHandler } from '../../application/queries/customer-analytics.query-handler';
import { DashboardOverviewQueryHandler } from '../../application/queries/dashboard-overview.query-handler';
import { FinancialBreakdownQueryHandler } from '../../application/queries/financial-breakdown.query-handler';
import { ForecastingQueryHandler } from '../../application/queries/forecasting.query-handler';
import { RevenueAnalyticsQueryHandler } from '../../application/queries/revenue-analytics.query-handler';
import { ServicePerformanceQueryHandler } from '../../application/queries/service-performance.query-handler';
import { TimeSeriesQueryHandler } from '../../application/queries/time-series.query-handler';
import { FeeReconciliationService } from '../../application/services/fee-reconciliation.service';
import { FinanceService } from '../../application/services/finance.service';
import { ReportExportService } from '../../application/services/report-export.service';
import { BarberPerformanceQueryDto } from '../dtos/barber-performance-query.dto';
import { BarberPerformanceResponseDto } from '../dtos/barber-performance-response.dto';
import { CapacityQueryDto } from '../dtos/capacity-query.dto';
import { CapacityResponseDto } from '../dtos/capacity-response.dto';
import { CustomerAnalyticsQueryDto } from '../dtos/customer-analytics-query.dto';
import { CustomerAnalyticsResponseDto } from '../dtos/customer-analytics-response.dto';
import { DashboardQueryDto } from '../dtos/dashboard-query.dto';
import { DashboardResponseDto } from '../dtos/dashboard-response.dto';
import { FeeImportDto, FeeReconciliationResponseDto } from '../dtos/fee-reconciliation.dto';
import { FinancialBreakdownQueryDto } from '../dtos/financial-breakdown-query.dto';
import { FinancialBreakdownResponseDto } from '../dtos/financial-breakdown-response.dto';
import { ForecastingQueryDto } from '../dtos/forecasting-query.dto';
import { ForecastingResponseDto } from '../dtos/forecasting-response.dto';
import { ReportExportQueryDto } from '../dtos/report-export-query.dto';
import { RevenueAnalyticsQueryDto } from '../dtos/revenue-analytics-query.dto';
import { RevenueAnalyticsResponseDto } from '../dtos/revenue-analytics-response.dto';
import { ServicePerformanceQueryDto } from '../dtos/service-performance-query.dto';
import { ServicePerformanceResponseDto } from '../dtos/service-performance-response.dto';
import { TimeSeriesQueryDto } from '../dtos/time-series-query.dto';
import { TimeSeriesResponseDto } from '../dtos/time-series-response.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('finance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly dashboardHandler: DashboardOverviewQueryHandler,
    private readonly revenueHandler: RevenueAnalyticsQueryHandler,
    private readonly barberPerfHandler: BarberPerformanceQueryHandler,
    private readonly timeSeriesHandler: TimeSeriesQueryHandler,
    private readonly servicePerfHandler: ServicePerformanceQueryHandler,
    private readonly customerHandler: CustomerAnalyticsQueryHandler,
    private readonly capacityHandler: CapacityQueryHandler,
    private readonly breakdownHandler: FinancialBreakdownQueryHandler,
    private readonly forecastHandler: ForecastingQueryHandler,
    private readonly reportExportService: ReportExportService,
    private readonly feeReconciliationService: FeeReconciliationService,
  ) {}

  // ── Barber Summary ───────────────────────────────────────────────

  @Get('barber/:barberId/summary')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get earnings summary for a barber' })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Returns barber earnings summary' })
  getBarberEarningsSummary(@Param('barberId') barberId: string) {
    return this.financeService.getBarberEarningsSummary(barberId);
  }

  // ── Dashboard & Analytics ──────────────────────────────────────────

  @Get('dashboard')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Financial dashboard overview with KPIs and comparisons' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard with revenue, growth, and composition',
    type: DashboardResponseDto,
  })
  getDashboard(@Query() query: DashboardQueryDto, @CurrentUser() user: JwtPayload) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.dashboardHandler.execute(resolved, query.period, query.comparePrevious);
  }

  @Get('analytics/revenue')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Detailed revenue analytics by period, barber, and service' })
  @ApiResponse({ status: 200, description: 'Revenue breakdown', type: RevenueAnalyticsResponseDto })
  getRevenueAnalytics(@Query() query: RevenueAnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.revenueHandler.execute(
      resolved,
      query.granularity,
      query.startDate,
      query.endDate,
      query.barberId,
      query.serviceId,
      query.comparePrevious,
    );
  }

  @Get('analytics/barbers')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Barber performance metrics and ranking' })
  @ApiResponse({
    status: 200,
    description: 'Per-barber performance data',
    type: BarberPerformanceResponseDto,
  })
  getBarberPerformance(@Query() query: BarberPerformanceQueryDto, @CurrentUser() user: JwtPayload) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.barberPerfHandler.execute(resolved, query.startDate, query.endDate, query.barberId);
  }

  @Get('analytics/trends')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Time-series revenue trends with period comparison' })
  @ApiResponse({
    status: 200,
    description: 'Time series data with growth rates and peaks',
    type: TimeSeriesResponseDto,
  })
  getTrends(@Query() query: TimeSeriesQueryDto, @CurrentUser() user: JwtPayload) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.timeSeriesHandler.execute(
      resolved,
      query.startDate,
      query.endDate,
      query.granularity,
      query.metric,
    );
  }

  @Get('analytics/services')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Service performance analytics and demand trends' })
  @ApiResponse({
    status: 200,
    description: 'Per-service performance data with trends',
    type: ServicePerformanceResponseDto,
  })
  getServicePerformance(
    @Query() query: ServicePerformanceQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.servicePerfHandler.execute(
      resolved,
      query.granularity,
      query.startDate,
      query.endDate,
      query.serviceId,
    );
  }

  @Get('analytics/customers')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Customer behavior analytics (LTV, retention, churn)' })
  @ApiResponse({
    status: 200,
    description: 'Customer metrics and top customers',
    type: CustomerAnalyticsResponseDto,
  })
  getCustomerAnalytics(@Query() query: CustomerAnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.customerHandler.execute(resolved, query.startDate, query.endDate, query.topLimit);
  }

  @Get('analytics/capacity')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Capacity utilization per barber with lost revenue estimates' })
  @ApiResponse({
    status: 200,
    description: 'Utilization rates and capacity data',
    type: CapacityResponseDto,
  })
  getCapacity(@Query() query: CapacityQueryDto, @CurrentUser() user: JwtPayload) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.capacityHandler.execute(resolved, query.startDate, query.endDate, query.barberId);
  }

  @Get('analytics/breakdown')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Detailed financial breakdown (fees, discounts, refunds)' })
  @ApiResponse({
    status: 200,
    description: 'Revenue composition and fee ratios',
    type: FinancialBreakdownResponseDto,
  })
  getFinancialBreakdown(
    @Query() query: FinancialBreakdownQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.breakdownHandler.execute(resolved, query.startDate, query.endDate);
  }

  @Get('analytics/forecast')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revenue forecasting with anomaly detection and seasonal patterns' })
  @ApiResponse({
    status: 200,
    description: 'Forecast, anomalies, and seasonal patterns',
    type: ForecastingResponseDto,
  })
  getForecast(@Query() query: ForecastingQueryDto, @CurrentUser() user: JwtPayload) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    return this.forecastHandler.execute(
      resolved,
      query.granularity,
      query.periodsAhead,
      query.lookbackPeriods,
    );
  }

  // ── Reports ────────────────────────────────────────────────────────

  @Get('reports/export')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export financial report as CSV or JSON' })
  @ApiResponse({ status: 200, description: 'Downloadable report file' })
  async exportReport(
    @Query() query: ReportExportQueryDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const resolved = resolveEstablishmentId(query.establishmentId, user);
    const result = await this.reportExportService.export(
      resolved,
      query.format,
      query.reportType,
      query.startDate,
      query.endDate,
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  // ── Fee Reconciliation ─────────────────────────────────────────────

  @Post('reconciliation/:establishmentId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reconcile imported fees against calculated fees' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation results with mismatches',
    type: FeeReconciliationResponseDto,
  })
  reconcileFees(@Param('establishmentId') establishmentId: string, @Body() dto: FeeImportDto) {
    return this.feeReconciliationService.reconcile(establishmentId, dto.items);
  }

  @Get('reconciliation/:establishmentId/report')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get fee reconciliation report' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({
    status: 200,
    description: 'Fee reconciliation summary',
    type: FeeReconciliationResponseDto,
  })
  getReconciliationReport(
    @Param('establishmentId') establishmentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.feeReconciliationService.getReconciliationReport(
      establishmentId,
      startDate,
      endDate,
    );
  }
}
