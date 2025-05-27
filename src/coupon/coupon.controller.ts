import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Put,
  Patch,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponPaginationDto, CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { ObjectIdDto } from 'src/user/dto';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   *  @docs    Admin Can create a new coupon
   *  @Route   POST /api/v1/coupon
   *  @access  Private [admin]
   */
  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create(req, createCouponDto);
  }

  /**
   *  @docs    Any User Can get any enabled coupon
   *  @Route   GET /api/v1/coupon
   *  @access  Public
   */
  @Get()
  findAll(@Query() couponPaginationDto: CouponPaginationDto) {
    return this.couponService.findAll(couponPaginationDto);
  }

  /**
   *  @docs    Any User Can get any Coupon by id
   *  @Route   GET /api/v1/coupon/:id
   *  @access  Public
   */
  @Get(':id')
  findOne(@Param() params: ObjectIdDto) {
    return this.couponService.findOne(params.id);
  }

  /**
   *  @docs    Admin Can update any product by id
   *  @Route   PUT /api/v1/product/:id
   *  @access  Private [admin]
   */
  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  update(
    @Req() req: Request,
    @Param() params: ObjectIdDto,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponService.update(req, params.id, updateCouponDto);
  }

  /**
   *  @docs    Admin Can delete any coupon by id from database
   *  @Route   DELETE /api/v1/coupon/:id
   *  @access  Private [admin]
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  remove(@Req() req: Request, @Param() params: ObjectIdDto) {
    return this.couponService.remove(req, params.id);
  }

  /**
   *  @docs    Admin Can disable any coupon by id
   *  @Route   DELETE /api/v1/coupon/:id
   *  @access  Private [admin]
   */
  @Patch(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  disableCoupon(@Req() req: Request, @Param() params: ObjectIdDto) {
    return this.couponService.disableCoupon(req, params.id);
  }

  /**
   *  @docs    Admin Can disable any user coupon by id
   *  @Route   DELETE /api/v1/coupon/disable-user/:id
   *  @access  Private [admin]
   */
  @Patch('disable-user/:id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  disableUserCoupon(
    @Req() req: Request,
    @Param() params: ObjectIdDto,
    @Body() body: { userId: string },
  ) {
    return this.couponService.removeUserFromCoupon(req, params.id, body.userId);
  }
}
