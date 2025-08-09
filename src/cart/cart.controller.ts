import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Put,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto, UpdateCartDto, ApplyCouponDto } from './dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { Request } from 'express';
import { ObjectIdDto } from 'src/user/dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ======== For User ========== \\

  /**
   *  @docs    User Can add a new product to cart
   *  @Route   POST /api/v1/cart
   *  @access  Private [user]
   */
  @Post()
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() createCartDto: CreateCartDto) {
    return this.cartService.addToCart(req, createCartDto);
  }

  /**
   *  @docs    User Can update the quantity and color of a product in cart
   *  @Route   PUT /api/v1/cart
   *  @access  Private [user]
   */
  @Put()
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  update(@Req() req: Request, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.updateCartProduct(req, updateCartDto);
  }

  /**
   *  @docs    User Can apply coupon to cart
   *  @Route   POST /api/v1/cart/apply-coupon
   *  @access  Private [user]
   */
  @Post('apply-coupon')
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  applyCoupon(@Req() req: Request, @Body() applyCouponDto: ApplyCouponDto) {
    return this.cartService.applyCoupon(req, applyCouponDto);
  }

  /**
   *  @docs    User Can get their cart
   *  @Route   GET /api/v1/cart
   *  @access  Private [user]
   */
  @Get()
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  getUserCart(@Req() req: Request) {
    return this.cartService.getUserCart(req);
  }

  /**
   *  @docs    User Can remove a product from their cart
   *  @Route   DELETE /api/v1/cart/:id
   *  @access  Private [user]
   *  @param   id - Product ID to be removed from cart
   */
  @Delete(':id')
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  removeProductFromCart(
    @Req() req: Request,
    @Body() createCartDto: CreateCartDto,
    @Param() params: ObjectIdDto,
  ) {
    return this.cartService.removeProductFromCart(
      req,
      createCartDto,
      params.id,
    );
  }

  /**
   *  @docs    User Can clear their entire cart
   *  @Route   DELETE /api/v1/cart
   *  @access  Private [user]
   */
  @Delete()
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  clearUserCart(@Req() req: Request) {
    return this.cartService.clearUserCart(req);
  }

  // ======== For Admin ========== \\

  /**
   *  @docs    Admin Can get all carts
   *  @Route   GET /api/v1/cart/admin
   *  @access  private [admin]
   */
  @Get('/admin')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  getAllCarts() {
    return this.cartService.getAllCarts();
  }

  /**
   *  @docs    Admin Can get all carts
   *  @Route   GET /api/v1/cart/admin
   *  @access  private [admin]
   */
  @Get('/admin/:id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  getCartByUserId(@Param() @Param() params: ObjectIdDto) {
    return this.cartService.getCartByUserId(params.id);
  }
}
