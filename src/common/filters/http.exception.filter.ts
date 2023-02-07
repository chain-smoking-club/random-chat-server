import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(HttpException, WsException)
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException & WsException, host: ArgumentsHost) {
    console.log('2222222222');
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    if (!response.status) {
      console.log('1111111111');
      const filter = new BaseWsExceptionFilter();
      filter.catch(exception, host);
      return;
    } else {
      const status = exception.getStatus();

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
