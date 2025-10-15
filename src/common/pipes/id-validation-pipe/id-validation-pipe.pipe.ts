import { ArgumentMetadata, BadRequestException, Injectable, ParseIntPipe, PipeTransform } from '@nestjs/common';

@Injectable()
export class IdValidationPipePipe extends ParseIntPipe {
  constructor() {
    super({
      exceptionFactory: () => new BadRequestException("Id no válido")
    })
  }
}
