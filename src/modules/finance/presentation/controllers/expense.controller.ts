import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { RolesGuard } from '../../../../common/guards';
import { resolveEstablishmentId } from '../../../../common/utils/resolve-establishment';
import { FindExpensesQueryHandler } from '../../application/queries/find-expenses.query-handler';
import { ExpenseService } from '../../application/services/expense.service';
import { CreateExpenseDto } from '../dtos/create-expense.dto';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { FindExpensesQueryDto } from '../dtos/find-expenses-query.dto';
import { UpdateExpenseDto } from '../dtos/update-expense.dto';

@ApiTags('Finance - Expenses')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('finance/expenses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly findExpensesQueryHandler: FindExpensesQueryHandler,
  ) {}

  @Post()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created' })
  async create(@Body() dto: CreateExpenseDto, @CurrentUser() user: JwtPayload) {
    const establishmentId = resolveEstablishmentId(dto.establishmentId, user);
    if (!establishmentId) {
      throw new BadRequestException('Establishment ID is required');
    }
    const expense = await this.expenseService.create(establishmentId, dto);
    return ExpenseResponseDto.fromDomain(expense);
  }

  @Get()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List expenses with filters' })
  @ApiResponse({ status: 200, description: 'List of expenses' })
  async findAll(@Query() query: FindExpensesQueryDto, @CurrentUser() user: JwtPayload) {
    const establishmentId = resolveEstablishmentId(query.establishmentId, user);
    if (!establishmentId) {
      throw new BadRequestException('Establishment ID is required');
    }

    const result = await this.findExpensesQueryHandler.execute({
      establishmentId,
      page: query.page,
      pageSize: query.pageSize,
      category: query.category,
      barberId: query.barberId,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      data: ExpenseResponseDto.fromDomainList(result.data),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  @Put(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense updated' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    const expense = await this.expenseService.update(id, dto);
    return ExpenseResponseDto.fromDomain(expense);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 204, description: 'Expense deleted' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async remove(@Param('id') id: string) {
    await this.expenseService.delete(id);
  }
}
