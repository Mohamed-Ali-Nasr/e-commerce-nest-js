import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { GetAuditLogsDto } from './dto/get-audit-log.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   *  @docs    Admin Can get all audit logs
   *  @Route   GET /api/v1/audit-log
   *  @access  Private [admin]
   */
  @Get()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  findAll(@Query() getAuditLogsDto: GetAuditLogsDto) {
    return this.auditLogService.findAll(getAuditLogsDto);
  }
}
