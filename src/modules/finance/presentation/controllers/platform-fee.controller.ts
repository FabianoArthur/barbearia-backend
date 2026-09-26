import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
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
import { CurrentUser, type JwtPayload, Roles } from '../../../../common/decorators';
import { RolesGuard } from '../../../../common/guards';
import { resolveEstablishmentId } from '../../../../common/utils/resolve-establishment';
import { PlatformFeeService } from '../../application/services/platform-fee.service';
import {
  CreatePlatformFeeDto,
  PlatformFeeResponseDto,
  UpdatePlatformFeeDto,
} from '../dtos/platform-fee.dto';

@ApiTags('Finance - Platform Fees')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('finance/fees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PlatformFeeController {
  constructor(private readonly platformFeeService: PlatformFeeService) {}

  @Get()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all fee configs for an establishment' })
  @ApiQuery({
    name: 'establishmentId',
    required: false,
    description: 'Establishment ID (omit to use own)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of platform fee configs',
    type: [PlatformFeeResponseDto],
  })
  getByEstablishment(
    @Query('establishmentId') establishmentId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const resolved = resolveEstablishmentId(establishmentId, user);
    return this.platformFeeService.getByEstablishment(resolved);
  }

  @Post(':establishmentId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new platform fee config' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({ status: 201, description: 'Fee config created', type: PlatformFeeResponseDto })
  create(@Param('establishmentId') establishmentId: string, @Body() dto: CreatePlatformFeeDto) {
    return this.platformFeeService.create({
      establishmentId,
      feeType: dto.feeType,
      percentageRate: dto.percentageRate,
      flatAmount: dto.flatAmount,
      minFee: dto.minFee,
      maxFee: dto.maxFee,
      includesTips: dto.includesTips,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
    });
  }

  @Put(':feeId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a platform fee config' })
  @ApiParam({ name: 'feeId', description: 'Fee config ID' })
  @ApiResponse({ status: 200, description: 'Fee config updated', type: PlatformFeeResponseDto })
  @ApiResponse({ status: 404, description: 'Fee config not found' })
  update(@Param('feeId') feeId: string, @Body() dto: UpdatePlatformFeeDto) {
    return this.platformFeeService.update(feeId, {
      ...dto,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
    });
  }
}
