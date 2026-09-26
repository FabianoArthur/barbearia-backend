import { Module } from '@nestjs/common';
import { BarberModule } from '../barber/barber.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { BarberPerformanceQueryHandler } from './application/queries/barber-performance.query-handler';
import { CapacityQueryHandler } from './application/queries/capacity.query-handler';
import { CustomerAnalyticsQueryHandler } from './application/queries/customer-analytics.query-handler';
import { DashboardOverviewQueryHandler } from './application/queries/dashboard-overview.query-handler';
import { FinancialBreakdownQueryHandler } from './application/queries/financial-breakdown.query-handler';
import { FindExpensesQueryHandler } from './application/queries/find-expenses.query-handler';
import { ForecastingQueryHandler } from './application/queries/forecasting.query-handler';
import { RevenueAnalyticsQueryHandler } from './application/queries/revenue-analytics.query-handler';
import { ServicePerformanceQueryHandler } from './application/queries/service-performance.query-handler';
import { TimeSeriesQueryHandler } from './application/queries/time-series.query-handler';
import { ExpenseService } from './application/services/expense.service';
import { FeeReconciliationService } from './application/services/fee-reconciliation.service';
import { FinanceService } from './application/services/finance.service';
import { PlatformFeeService } from './application/services/platform-fee.service';
import { ReportExportService } from './application/services/report-export.service';
import { EXPENSE_REPOSITORY } from './domain/interfaces/expense-repository.interface';
import { FINANCE_ANALYTICS_REPOSITORY } from './domain/interfaces/finance-analytics-repository.interface';
import { PLATFORM_FEE_REPOSITORY } from './domain/interfaces/platform-fee-repository.interface';
import { PrismaExpenseRepository } from './infrastructure/repositories/prisma-expense.repository';
import { PrismaFinanceAnalyticsRepository } from './infrastructure/repositories/prisma-finance-analytics.repository';
import { PrismaPlatformFeeRepository } from './infrastructure/repositories/prisma-platform-fee.repository';
import { ExpenseController } from './presentation/controllers/expense.controller';
import { FinanceController } from './presentation/controllers/finance.controller';
import { PlatformFeeController } from './presentation/controllers/platform-fee.controller';

@Module({
  imports: [ScheduleModule, BarberModule],
  controllers: [FinanceController, PlatformFeeController, ExpenseController],
  providers: [
    // Services
    FinanceService,
    PlatformFeeService,
    ReportExportService,
    FeeReconciliationService,
    ExpenseService,

    // Query Handlers
    FindExpensesQueryHandler,
    DashboardOverviewQueryHandler,
    RevenueAnalyticsQueryHandler,
    BarberPerformanceQueryHandler,
    TimeSeriesQueryHandler,
    ServicePerformanceQueryHandler,
    CustomerAnalyticsQueryHandler,
    CapacityQueryHandler,
    FinancialBreakdownQueryHandler,
    ForecastingQueryHandler,

    // Repositories
    {
      provide: FINANCE_ANALYTICS_REPOSITORY,
      useClass: PrismaFinanceAnalyticsRepository,
    },
    {
      provide: PLATFORM_FEE_REPOSITORY,
      useClass: PrismaPlatformFeeRepository,
    },
    {
      provide: EXPENSE_REPOSITORY,
      useClass: PrismaExpenseRepository,
    },
  ],
  exports: [FinanceService, PlatformFeeService],
})
export class FinanceModule {}
