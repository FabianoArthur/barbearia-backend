import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
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
import { CurrentUser, type JwtPayload, Roles } from '../../../../common/decorators';
import { RolesGuard } from '../../../../common/guards';
import { FindUsersQueryHandler } from '../../application/queries/find-users.query-handler';
import { UserService } from '../../application/services/user.service';
import { FindUsersQueryDto } from '../dtos/find-users-query.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly findUsersQueryHandler: FindUsersQueryHandler,
  ) {}

  @Get()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users (paginated, filterable, sortable)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of users' })
  findAll(@Query() query: FindUsersQueryDto) {
    return this.findUsersQueryHandler.execute(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns the authenticated user' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.userService.findById(user.sub);
  }

  @Get('establishment/:establishmentId')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users by establishment' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  findAllByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.userService.findAllByEstablishment(establishmentId);
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
