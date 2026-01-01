import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { UserType } from '../../utils/enums';
import { JWTPayloadType } from '../../utils/types';

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
