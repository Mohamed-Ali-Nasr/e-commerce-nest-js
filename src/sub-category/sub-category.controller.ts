import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import {
  CategoryIdDto,
  CreateSubCategoryDto,
  SubCategoryPaginationDto,
} from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { Request } from 'express';
import { ObjectIdDto } from 'src/user/dto';

@Controller('sub-category')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  /**
   *  @docs    Admin Can create a new sub category
   *  @Route   POST /api/v1/sub-category
   *  @access  Private [admin]
   */
  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  create(
    @Req() req: Request,
    @Body() createSubCategoryDto: CreateSubCategoryDto,
    @Query() categoryIdDto: CategoryIdDto,
  ) {
    return this.subCategoryService.create(
      req,
      createSubCategoryDto,
      categoryIdDto,
    );
  }

  /**
   *  @docs    Any User Can get any sub category
   *  @Route   GET /api/v1/sub-category
   *  @access  Public
   */
  @Get()
  findAll(@Query() subCategoryPaginationDto: SubCategoryPaginationDto) {
    return this.subCategoryService.findAll(subCategoryPaginationDto);
  }

  /**
   *  @docs    Any User Can get any sub category by id
   *  @Route   GET /api/v1/sub-category/:id
   *  @access  Public
   */
  @Get(':id')
  findOne(@Param() params: ObjectIdDto) {
    return this.subCategoryService.findOne(params.id);
  }

  /**
   *  @docs    Admin Can update any sub category by id
   *  @Route   PUT /api/v1/sub-category/:id
   *  @access  Private [admin]
   */
  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  update(
    @Req() req: Request,
    @Param() params: ObjectIdDto,
    @Body() updateCategoryDto: UpdateSubCategoryDto,
  ) {
    return this.subCategoryService.update(req, params.id, updateCategoryDto);
  }

  /**
   *  @docs    Admin Can delete any sub category by id
   *  @Route   DELETE /api/v1/sub-category/:id
   *  @access  Private [admin]
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  remove(@Param() params: ObjectIdDto) {
    return this.subCategoryService.remove(params.id);
  }
}
