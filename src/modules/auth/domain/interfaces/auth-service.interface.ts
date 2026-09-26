export interface IAuthPayload {
  sub: string;
  email: string;
  role: string;
  establishmentId: string | null;
}

export interface IUserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  establishmentId: string | null;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResult {
  tokens: ITokenPair;
  user: IUserInfo;
}
