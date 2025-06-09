import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wishlist, WishlistDocument } from './wishlist.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { Product, productDocument } from 'src/product/product.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private wishlistModel: Model<WishlistDocument>,

    @InjectModel(Product.name)
    private productModel: Model<productDocument>,
  ) {}

  async addToWishlist(
    req: Request,
    createWishlistDto: CreateWishlistDto,
  ): Promise<{ status: number; message: string; data: Wishlist }> {
    const payload = req['user'] as { _id: string };

    const product = await this.productModel.findById(
      createWishlistDto.productId,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if the product already exists in the user's wishlist
    const existingWishlist = await this.wishlistModel.findOne({
      userId: payload._id,
      productId: createWishlistDto.productId,
    });

    if (existingWishlist) {
      throw new HttpException('Product already exists in wishlist', 400);
    }

    // Create a new wishlist entry
    const wishlist = await this.wishlistModel.create({
      ...createWishlistDto,
      userId: payload._id,
    });

    return {
      status: 201,
      message: 'Product added to wishlist successfully',
      data: wishlist,
    };
  }

  async getWishlist(
    req: Request,
  ): Promise<{ status: number; message: string; data: Wishlist[] }> {
    const payload = req['user'] as { _id: string };

    // Find all wishlist items for the user
    const wishlistItems = await this.wishlistModel
      .find({ userId: payload._id })
      .populate(
        'productId',
        '-__v -createdAt -updatedAt -category -subCategory -brand',
      );

    return {
      status: 200,
      message: 'Wishlist products found',
      data: wishlistItems,
    };
  }

  async removeFromWishlist(
    req: Request,
    createWishlistDto: CreateWishlistDto,
    id: string,
  ): Promise<{ status: number; message: string }> {
    const payload = req['user'] as { _id: string };

    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if the wishlist item exists
    const wishlistItem = await this.wishlistModel.findOne({
      productId: createWishlistDto.productId,
      userId: payload._id,
    });

    if (!wishlistItem) {
      throw new NotFoundException('Wishlist product not found');
    }

    // Remove the wishlist item
    const deletedWishlistItem = await this.wishlistModel.deleteOne({
      productId: createWishlistDto.productId,
      userId: payload._id,
    });

    if (deletedWishlistItem.deletedCount === 0) {
      throw new InternalServerErrorException(
        'Failed to remove product from wishlist',
      );
    }

    return {
      status: 200,
      message: 'product removed from wishlist successfully',
    };
  }
}
