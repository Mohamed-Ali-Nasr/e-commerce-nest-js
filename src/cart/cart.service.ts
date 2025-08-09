import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto, UpdateCartDto, ApplyCouponDto } from './dto';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './cart.schema';
import { Product, productDocument } from 'src/product/product.schema';
import { Coupon, couponDocument } from 'src/coupon/coupon.schema';
import { CouponType } from 'src/coupon/enum';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private cartModel: Model<CartDocument>,

    @InjectModel(Product.name)
    private productModel: Model<productDocument>,

    @InjectModel(Coupon.name)
    private couponModel: Model<couponDocument>,
  ) {}

  // ======== For User ========== \\

  async addToCart(
    req: Request,
    createCartDto: CreateCartDto,
  ): Promise<{ status: number; message: string; data: Cart }> {
    const payload = req['user'] as { _id: string; name: string };

    const cart = await this.cartModel
      .findOne({ user: payload._id })
      .populate('cartItems.productId', 'price priceAfterDiscount');

    const product = await this.productModel.findById(createCartDto.productId);

    // not found this product
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // quantity=0
    if (product.quantity <= 0) {
      throw new NotFoundException('Product is out of stock');
    }

    // if cart not exist create a new cart then add product to it
    if (!cart) {
      const newCart = await this.cartModel.create({
        user: payload._id,
        cartItems: [
          {
            productId: createCartDto.productId,
          },
        ],
        totalPrice: product.priceAfterDiscount
          ? product.priceAfterDiscount
          : product.price,
      });

      await (
        await newCart.save()
      ).populate('cartItems.productId', 'price priceAfterDiscount');

      return {
        status: 201,
        message: 'Product added to cart successfully',
        data: newCart,
      };
    }

    // if cart exist then check if product already in cart
    const existingItemIndex = cart.cartItems.findIndex(
      (item) =>
        (item.productId as unknown as productDocument)._id.toString() ===
        createCartDto.productId.toString(),
    );

    // if product already exist in cart
    if (existingItemIndex !== -1) {
      throw new HttpException('Product is already added to the cart', 400);
    }
    // if product not exist in cart then add it
    cart.cartItems.push({
      productId: createCartDto.productId,
      quantity: 1,
      color: '',
    });

    await cart.populate('cartItems.productId', 'price priceAfterDiscount');

    // calculate subTotal
    let subTotal = 0;

    cart.cartItems.map((item) => {
      const productPrice = (item.productId as unknown as productDocument)
        .priceAfterDiscount
        ? (item.productId as unknown as productDocument).priceAfterDiscount
        : (item.productId as unknown as productDocument).price;

      subTotal += item.quantity * productPrice;
    });

    cart.totalPrice = subTotal;

    await cart.save();

    return {
      status: 201,
      message: 'Product added to cart successfully',
      data: cart,
    };
  }

  async updateCartProduct(
    req: Request,
    updateCartDto: UpdateCartDto,
  ): Promise<{ status: number; message: string; data: Cart }> {
    const payload = req['user'] as { _id: string; name: string };

    const cart = await this.cartModel
      .findOne({ user: payload._id })
      .populate('cartItems.productId', 'price priceAfterDiscount');

    // if cart not exist create new cart
    if (!cart) {
      const result = await this.addToCart(req, {
        productId: updateCartDto.productId,
      });
      return result;
    }

    const product = await this.productModel.findById(updateCartDto.productId);

    // not found this product
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // quantity=0
    if (product.quantity <= 0) {
      throw new NotFoundException('Product is out of stock');
    }

    const indexOfProduct = cart.cartItems.findIndex(
      (item) =>
        (item.productId as unknown as productDocument)._id.toString() ===
        updateCartDto.productId.toString(),
    );

    if (indexOfProduct === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // update color
    if (updateCartDto.color) {
      cart.cartItems[indexOfProduct].color = updateCartDto.color;
    }

    // update quantity
    let subTotal = 0;

    if (updateCartDto.count) {
      cart.cartItems[indexOfProduct].quantity = updateCartDto.count;

      cart.cartItems.map((item) => {
        const productPrice = (item.productId as unknown as productDocument)
          .priceAfterDiscount
          ? (item.productId as unknown as productDocument).priceAfterDiscount
          : (item.productId as unknown as productDocument).price;

        subTotal += item.quantity * productPrice;
      });
    }

    cart.totalPrice = subTotal;

    await cart.save();

    return {
      status: 200,
      message: 'Cart updated successfully',
      data: cart,
    };
  }

  async applyCoupon(
    req: Request,
    applyCouponDto: ApplyCouponDto,
  ): Promise<{ status: number; message: string; data: Cart }> {
    const payload = req['user'] as { _id: string; name: string };

    const cart = await this.cartModel
      .findOne({ user: payload._id })
      .populate('cartItems.productId', 'price priceAfterDiscount');

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const coupon = await this.couponModel.findOne({
      couponCode: applyCouponDto.couponCode,
      isEnable: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found or not valid');
    }

    // Check if the coupon is already used by the user
    const userCoupon = coupon.users.find(
      (user) => user.userId.toString() === payload._id.toString(),
    );

    if (userCoupon) {
      if (userCoupon.disabled) {
        throw new BadRequestException('Coupon is disabled for this user');
      }

      if (userCoupon.usageCount >= userCoupon.maxCount) {
        throw new BadRequestException('Coupon usage limit exceeded');
      }

      // Increment usage count
      userCoupon.usageCount += 1;

      await coupon.save();

      // Add coupon to cart
      cart.coupons.push({
        couponCode: applyCouponDto.couponCode,
        couponId: coupon._id.toString(),
      });

      // Calculate total price after applying coupon
      let discountAmount = 0;
      if (coupon.couponType === CouponType.Amount) {
        discountAmount = coupon.couponAmount;
      } else if (coupon.couponType === CouponType.Precntage) {
        discountAmount = (cart.totalPrice * coupon.couponAmount) / 100;
      }

      cart.totalPrice = cart.totalPrice - discountAmount;

      if (cart.totalPrice < 0) {
        cart.totalPrice = 0; // Ensure total price does not go negative
      }

      // Save the cart with the applied coupon
      await cart.save();

      return {
        status: 200,
        message: 'Coupon Applied Successfully',
        data: cart,
      };
    }

    const usedCoupon = cart.coupons.findIndex(
      (item) => item.couponCode === applyCouponDto.couponCode,
    );
    if (usedCoupon !== -1) {
      throw new BadRequestException('Coupon already used');
    }

    // Add coupon to cart
    cart.coupons.push({
      couponCode: applyCouponDto.couponCode,
      couponId: coupon._id.toString(),
    });

    // Calculate total price after applying coupon
    let discountAmount = 0;
    if (coupon.couponType === CouponType.Amount) {
      discountAmount = coupon.couponAmount;
    } else if (coupon.couponType === CouponType.Precntage) {
      discountAmount = (cart.totalPrice * coupon.couponAmount) / 100;
    }

    cart.totalPrice = cart.totalPrice - discountAmount;

    if (cart.totalPrice < 0) {
      cart.totalPrice = 0; // Ensure total price does not go negative
    }

    // Save the cart with the applied coupon
    await cart.save();

    return {
      status: 200,
      message: 'Coupon Applied Successfully',
      data: cart,
    };
  }

  async getUserCart(
    req: Request,
  ): Promise<{ status: number; message: string; data: Cart }> {
    const payload = req['user'] as { _id: string; name: string };

    const cart = await this.cartModel
      .findOne({ user: payload._id })
      .select('-__v')
      .populate(
        'cartItems.productId',
        'price priceAfterDiscount imageCover title description',
      );

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return {
      status: 200,
      message: 'User Cart Found Successfully',
      data: cart,
    };
  }

  async removeProductFromCart(
    req: Request,
    createCartDto: CreateCartDto,
    productId: string,
  ): Promise<{ status: number; message: string; data: Cart }> {
    const payload = req['user'] as { _id: string; name: string };

    const cart = await this.cartModel
      .findOne({ user: payload._id })
      .populate('cartItems.productId', 'price priceAfterDiscount');

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const indexOfProduct = cart.cartItems.findIndex(
      (item) =>
        (item.productId as unknown as productDocument)._id.toString() ===
          createCartDto.productId.toString() &&
        (item.productId as unknown as productDocument)._id.toString() ===
          productId.toString(),
    );

    if (indexOfProduct === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // remove product from cart
    cart.cartItems = cart.cartItems.filter(
      (_, index) => index !== indexOfProduct,
    ) as [{ productId: string; quantity: number; color: string }];

    // update quantity
    let subTotal = 0;

    cart.cartItems.map((item) => {
      const productPrice = (item.productId as unknown as productDocument)
        .priceAfterDiscount
        ? (item.productId as unknown as productDocument).priceAfterDiscount
        : (item.productId as unknown as productDocument).price;

      subTotal += item.quantity * productPrice;
    });

    cart.totalPrice = subTotal;

    if (cart.cartItems.length < 1) {
      await this.cartModel.deleteOne({ user: payload._id });

      return {
        status: 200,
        message: 'Cart is empty now',
        data: null,
      };
    }

    await cart.save();

    return {
      status: 200,
      message: 'Product removed from cart successfully',
      data: cart,
    };
  }

  async clearUserCart(
    req: Request,
  ): Promise<{ status: number; message: string; data: null }> {
    const payload = req['user'] as { _id: string; name: string };

    const cart = await this.cartModel.findOne({ user: payload._id });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.cartModel.deleteOne({ user: payload._id });

    return {
      status: 200,
      message: 'Cart cleared successfully',
      data: null,
    };
  }

  // ======== For Admin ========== \\
  async getAllCarts(): Promise<{
    status: number;
    message: string;
    data: Cart[];
  }> {
    const carts = await this.cartModel
      .find()
      .populate('user', 'name email')
      .populate('cartItems.productId', 'title price priceAfterDiscount')
      .populate(
        'coupons.couponId',
        'couponType couponAmount isEnable startDate endDate',
      );

    if (!carts || carts.length === 0) {
      throw new NotFoundException('No carts found');
    }

    return {
      status: 200,
      message: 'Carts fetched successfully',
      data: carts,
    };
  }

  async getCartByUserId(userId: string): Promise<{
    status: number;
    message: string;
    data: Cart;
  }> {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate('user', 'name email')
      .populate('cartItems.productId', 'title price priceAfterDiscount')
      .populate(
        'coupons.couponId',
        'couponType couponAmount isEnable startDate endDate',
      );

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    return {
      status: 200,
      message: 'Cart fetched successfully',
      data: cart,
    };
  }
}
