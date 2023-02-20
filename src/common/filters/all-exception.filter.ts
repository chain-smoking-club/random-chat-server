import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private logger: Logger = new Logger('AllExceptionFilter');
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    this.logger.error(exception);

    response.status(status).json({
      statusCode: status,
      message: exception['message'],
      path: request.url,
    });
  }
}
