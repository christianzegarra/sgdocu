export interface LoggedUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  disabled: boolean;
  metadata: {
    creationTime: string | null;
    lastSignInTime: string | null;
  };
}
