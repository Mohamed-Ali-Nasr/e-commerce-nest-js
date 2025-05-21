import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  ProductPaginationDto,
} from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Request } from 'express';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { ObjectIdDto } from 'src/user/dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   *  @docs    Admin Can create a new product
   *  @Route   POST /api/v1/product
   *  @access  Private [admin]
   */
  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() createProductDto: CreateProductDto) {
    return this.productService.create(req, createProductDto);
  }

  /**
   *  @docs    Any User Can get any product
   *  @Route   GET /api/v1/product
   *  @access  Public
   */
  @Get()
  findAll(@Query() productPaginationDto: ProductPaginationDto) {
    return this.productService.findAll(productPaginationDto);
  }

  /**
   *  @docs    Any User Can get any product by id
   *  @Route   GET /api/v1/product/:id
   *  @access  Public
   */
  @Get(':id')
  findOne(@Param() params: ObjectIdDto) {
    return this.productService.findOne(params.id);
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
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(req, params.id, updateProductDto);
  }

  /**
   *  @docs    Admin Can delete any product by id
   *  @Route   DELETE /api/v1/product/:id
   *  @access  Private [admin]
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  remove(@Req() req: Request, @Param() params: ObjectIdDto) {
    return this.productService.remove(req, params.id);
  }
}
