// Small stub for the auth service - flesh out with bcrypt/jwt and user service
export async function registerUser(_data: any) {
  return { id: 'stub-id' };
}

export async function authenticateUser(_email: string, _password: string) {
  return null; // return user or null
}
