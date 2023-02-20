import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';

@Catch(BadRequestException)
export class WsValidationExceptionFilter
  implements ExceptionFilter<BadRequestException>
{
  private logger: Logger = new Logger('SocketGateway');
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient();
    const message = exception.getResponse();

    client.emit('error', message);

    this.logger.error(message);
  }
}
