import { Component } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  errorMsg = '';
  loading = false;
  usuario: User | null = null; 

  constructor(private authService: LoginService, private router: Router) { }

  async login() {
    this.errorMsg = '';
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/']); 
      this.errorMsg = 'Credenciales inválidas o usuario no registrado';
    } finally {
      this.loading = false;
    }
  }

  cerrarSesion() {
    this.authService.logout();
  }

}
