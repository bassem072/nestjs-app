import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CURRENT_USER_KEY } from 'src/utils/constants';
import { UserType } from 'src/utils/enums';
import { JWTPayloadType } from 'src/utils/types';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { [CURRENT_USER_KEY]: { id: number; userType: UserType } }
      >();
    const user: JWTPayloadType = request[CURRENT_USER_KEY];
    return user;
  },
);
