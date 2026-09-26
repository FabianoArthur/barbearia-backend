import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Roles } from '../../../../common/decorators';
import type { JwtPayload } from '../../../../common/decorators/current-user.decorator';
import { PaginatedResponseDto } from '../../../../common/dtos';
import { RolesGuard } from '../../../../common/guards';
import { resolveEstablishmentId } from '../../../../common/utils/resolve-establishment';
import { FindPaymentsQueryHandler } from '../../application/queries/find-payments.query-handler';
import { FindRefundsQueryHandler } from '../../application/queries/find-refunds.query-handler';
import { PaymentService } from '../../application/services/payment.service';
import { ConfirmPaymentDto } from '../dtos/confirm-payment.dto';
import { FindPaymentsQueryDto } from '../dtos/find-payments-query.dto';
import { FindRefundsQueryDto } from '../dtos/find-refunds-query.dto';
import { PaymentListItemDto } from '../dtos/payment-list-item.dto';
import { PaymentResponseDto } from '../dtos/payment-response.dto';
import { RefundDetailResponseDto } from '../dtos/refund-detail-response.dto';
import { RefundListItemDto } from '../dtos/refund-list-item.dto';
import { RefundPaymentDto } from '../dtos/refund-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly findPaymentsQuery: FindPaymentsQueryHandler,
    private readonly findRefundsQuery: FindRefundsQueryHandler,
  ) {}

  @Get()
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List payments with filters',
    description:
      'Returns paginated payments filtered by establishment, status, method, and date range.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of payments' })
  async findAll(@Query() query: FindPaymentsQueryDto, @CurrentUser() user: JwtPayload) {
    const establishmentId = resolveEstablishmentId(query.establishmentId, user);

    const result = await this.findPaymentsQuery.execute(establishmentId, query);

    return new PaginatedResponseDto(
      PaymentListItemDto.fromDomainList(result.data),
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('refunds')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List refunded payments',
    description: 'Returns paginated refunded payments filtered by establishment.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of refunds' })
  async findRefunds(@Query() query: FindRefundsQueryDto, @CurrentUser() user: JwtPayload) {
    const establishmentId = resolveEstablishmentId(query.establishmentId, user);

    const result = await this.findRefundsQuery.execute({
      establishmentId,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: RefundListItemDto.fromList(result.data),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  @Get('refunds/:id')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get refund details by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Refund details' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async findRefundById(@Param('id') id: string) {
    const payment = await this.findRefundsQuery.findById(id);
    return RefundDetailResponseDto.fromDomain(payment);
  }

  @Get('appointment/:appointmentId')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payment for a specific appointment' })
  @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findByAppointment(@Param('appointmentId') appointmentId: string) {
    const payment = await this.paymentService.findByAppointmentId(appointmentId);
    return PaymentResponseDto.fromDomain(payment);
  }

  @Get(':id')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findById(@Param('id') id: string) {
    const payment = await this.paymentService.findById(id);
    return PaymentResponseDto.fromDomain(payment);
  }

  @Patch(':id/confirm')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Confirm a pending payment',
    description: 'Sets the payment method and marks the payment as completed.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async confirm(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    const payment = await this.paymentService.confirmPayment(
      id,
      dto.method,
      dto.tipAmount,
      dto.notes,
    );
    return PaymentResponseDto.fromDomain(payment);
  }

  @Patch(':id/refund')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Refund a completed payment',
    description: 'Marks the payment as refunded. Partial refund is supported via the amount field.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment refunded' })
  @ApiResponse({ status: 400, description: 'Invalid status transition or amount' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    const payment = await this.paymentService.refundPayment(id, dto.amount, dto.reason);
    return PaymentResponseDto.fromDomain(payment);
  }
}
