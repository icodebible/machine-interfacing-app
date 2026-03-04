import { Injectable, signal } from '@angular/core';

export type SessionUser = {
  id: string;
  username: string;
  authorities: string[];
  mustChangePassword: boolean;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<SessionUser | null>(null);

  async login(username: string, password: string) {
    const res = await window.appAPI.authLogin(username, password);
    this.user.set(res.user);
    return res.user;
  }

  async changePassword(newPassword: string) {
    const u = this.user();
    if (!u) throw new Error('Not logged in');
    await window.appAPI.authChangePassword(u.id, newPassword);
    // refresh local state
    this.user.set({ ...u, mustChangePassword: false });
  }

  logout() {
    this.user.set(null);
  }

  has(authority: string) {
    const u = this.user();
    return !!u?.authorities?.includes('SUPER_ADMIN') || !!u?.authorities?.includes(authority);
  }
}
