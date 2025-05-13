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
import { BrandService } from './brand.service';
import { BrandPaginationDto, CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { ObjectIdDto } from 'src/user/dto';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  /**
   *  @docs    Admin Can create a new brand
   *  @Route   POST /api/v1/brand
   *  @access  Private [admin]
   */
  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(req, createBrandDto);
  }

  /**
   *  @docs    Any User Can get any brand
   *  @Route   GET /api/v1/brand
   *  @access  Public
   */
  @Get()
  findAll(@Query() brandPaginationDto: BrandPaginationDto) {
    return this.brandService.findAll(brandPaginationDto);
  }

  /**
   *  @docs    Any User Can get brand by id
   *  @Route   GET /api/v1/brand/:id
   *  @access  Public
   */
  @Get(':id')
  findOne(@Param() params: ObjectIdDto) {
    return this.brandService.findOne(params.id);
  }

  /**
   *  @docs    Admin Can update any brand by id
   *  @Route   PUT /api/v1/brand/:id
   *  @access  Private [admin]
   */
  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  update(
    @Req() req: Request,
    @Param() params: ObjectIdDto,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandService.update(req, params.id, updateBrandDto);
  }

  /**
   *  @docs    Admin Can delete any brand by id
   *  @Route   DELETE /api/v1/brand/:id
   *  @access  Private [admin]
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  remove(@Param() params: ObjectIdDto) {
    return this.brandService.remove(params.id);
  }
}
