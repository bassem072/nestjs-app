import { UserType } from './enums';

export type JWTPayloadType = {
  id: number;
  userType: UserType;
};

export type AccessTokenType = {
  accessToken: string;
};
