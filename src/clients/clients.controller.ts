import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { IdValidationPipePipe } from '../common/pipes/id-validation-pipe/id-validation-pipe.pipe';
import { User } from '../auth/decorators/user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @User() user: JwtUser) {
    return this.clientsService.create(createClientDto, +user.sub);
  }

  @Get()
  findAll(@User() user: JwtUser) {
    return this.clientsService.findAll(+user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id', IdValidationPipePipe) id: number,
    @User() user: JwtUser,
  ) {
    return this.clientsService.findOne(id, +user.sub);
  }

  @Put(':id')
  update(
    @Param('id', IdValidationPipePipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @User() user: JwtUser,
  ) {
    return this.clientsService.update(id, updateClientDto, +user.sub);
  }

  @Delete(':id')
  remove(@Param('id', IdValidationPipePipe) id: number, @User() user: JwtUser) {
    return this.clientsService.remove(id, +user.sub);
  }
}
