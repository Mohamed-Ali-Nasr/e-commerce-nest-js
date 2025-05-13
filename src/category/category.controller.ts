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
} from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CategoryPaginationDto,
  CreateCategoryDto,
} from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { Request } from 'express';
import { ObjectIdDto } from 'src/user/dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   *  @docs    Admin Can create a new category
   *  @Route   POST /api/v1/category
   *  @access  Private [admin]
   */
  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(req, createCategoryDto);
  }

  /**
   *  @docs    Any User Can get any category
   *  @Route   GET /api/v1/category
   *  @access  Public
   */
  @Get()
  findAll(@Query() categoryPaginationDto: CategoryPaginationDto) {
    return this.categoryService.findAll(categoryPaginationDto);
  }

  /**
   *  @docs    Any User Can get category by id
   *  @Route   GET /api/v1/category/:id
   *  @access  Public
   */
  @Get(':id')
  findOne(@Param() params: ObjectIdDto) {
    return this.categoryService.findOne(params.id);
  }

  /**
   *  @docs    Admin Can update any category by id
   *  @Route   PUT /api/v1/category/:id
   *  @access  Private [admin]
   */
  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  update(
    @Req() req: Request,
    @Param() params: ObjectIdDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(req, params.id, updateCategoryDto);
  }

  /**
   *  @docs    Admin Can delete any category by id
   *  @Route   DELETE /api/v1/category/:id
   *  @access  Private [admin]
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  remove(@Req() req: Request, @Param() params: ObjectIdDto) {
    return this.categoryService.remove(req, params.id);
  }
}
