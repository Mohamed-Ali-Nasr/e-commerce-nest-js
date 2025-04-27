import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
  Query,
  Put,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  ObjectIdDto,
  PaginationDto,
  UpdateUserDto,
} from './dto';
import { AuthGuard } from './guard/auth.guard';
import { Roles } from './decorator/roles.decorator';
import { Role } from './enum';
import { Request } from 'express';

// ===================== For Admin Only =====================
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   *  @docs    Admin Can Create User
   *  @Route   POST /api/v1/user
   *  @access  Private [admin]
   */
  @Post()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  create(
    @Body(ValidationPipe)
    createUserDto: CreateUserDto,
  ) {
    return this.userService.create(createUserDto);
  }

  /**
   *  @docs    Admin Can Get All Users
   *  @Route   GET /api/v1/user
   *  @access  Private [admin]
   */
  @Get()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto);
  }

  /**
   *  @docs    Admin Can Get Single User
   *  @Route   GET /api/v1/user/:id
   *  @access  Private [admin]
   */
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param() params: ObjectIdDto) {
    return this.userService.findOne(params.id);
  }

  /**
   *  @docs    Admin Can Update Single User
   *  @Route   PUT /api/v1/user/:id
   *  @access  Private [admin]
   */
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(':id')
  update(
    @Param() params: ObjectIdDto,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(params.id, updateUserDto);
  }

  /**
   *  @docs    Admin Can Delete Single User
   *  @Route   DELETE /api/v1/user/:id
   *  @access  Private [admin]
   */
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param() params: ObjectIdDto) {
    return this.userService.remove(params.id);
  }
}

// ===================== For User Only =====================
@Controller('user-me')
export class UserMeController {
  constructor(private readonly userService: UserService) {}

  /**
   *  @docs    Any User can get data on your account
   *  @Route   GET /api/v1/user-me
   *  @access  Private [user, admin]
   */
  @Get()
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard)
  getMe(@Req() req) {
    return this.userService.getMe(req.user);
  }

  /**
   *  @docs    Any User can update data on your account
   *  @Route   PUT /api/v1/user-me
   *  @access  Private [user]
   */
  @Put()
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard)
  updateMe(
    @Req() req: Request,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateMe(req, updateUserDto);
  }

  /**
   *  @docs    Any User can unActive account
   *  @Route   DELETE /api/v1/user-me
   *  @access  Private [user]
   */
  @Delete()
  @Roles(Role.User)
  @UseGuards(AuthGuard)
  deleteMe(@Req() req) {
    return this.userService.deleteMe(req.user);
  }
}
