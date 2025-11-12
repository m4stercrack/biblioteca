import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private usuarioActualSubject = new BehaviorSubject<User | null>(null);
  usuarioActual$ = this.usuarioActualSubject.asObservable();
  constructor(private auth: Auth) {
    // Detectar si hay un usuario logueado
    onAuthStateChanged(this.auth, (user) => {
      this.usuarioActualSubject.next(user);
    });
  }
  /** Inicia sesión con correo y contraseña */
  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    this.usuarioActualSubject.next(cred.user);
    return cred.user;
  }
  /** Cierra la sesión actual */
  async logout() {
    await signOut(this.auth);
    this.usuarioActualSubject.next(null);
  }
  /** Devuelve el usuario actual */
  get usuarioActual(): User | null {
    return this.auth.currentUser;
  }
}
