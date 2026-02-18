export type AuthenticatedUser = {
  name: string;
  email: string;
  username: string;
};

export type AuthSession = {
  token: string;
  sessionId: string;
  applicationName: string;
  username: string;
  user: AuthenticatedUser;
  lastActivityAt: number;
};
