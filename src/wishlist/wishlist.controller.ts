import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { Request } from 'express';
import { ObjectIdDto } from 'src/user/dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   *  @docs    User Can add a new product to wishlist
   *  @Route   POST /api/v1/wishlist
   *  @access  Private [user]
   */
  @Post()
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() createWishlistDto: CreateWishlistDto) {
    return this.wishlistService.addToWishlist(req, createWishlistDto);
  }

  /**
   *  @docs    User Can get all products in wishlist
   *  @Route   POST /api/v1/wishlist
   *  @access  Private [user]
   */
  @Get()
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  findAll(@Req() req: Request) {
    return this.wishlistService.getWishlist(req);
  }

  /**
   *  @docs    User Can remove a product from wishlist by productId
   *  @Route   POST /api/v1/wishlist/:id
   *  @access  Private [user]
   */
  @Delete(':id')
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  remove(
    @Req() req: Request,
    @Body() createWishlistDto: CreateWishlistDto,
    @Param() params: ObjectIdDto,
  ) {
    return this.wishlistService.removeFromWishlist(
      req,
      createWishlistDto,
      params.id,
    );
  }
}
