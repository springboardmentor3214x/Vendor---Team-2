import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  login(email: string, password: string) {
    console.log('Login:', email, password);

    return {
      subscribe: ({ next }: any) => {
        localStorage.setItem('token', 'dummy-jwt-token');
        next();
      }
    };
  }

  register(fullName: string, email: string, password: string) {
    console.log('Register:', fullName, email, password);

    return {
      subscribe: ({ next }: any) => {
        next();
      }
    };
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}