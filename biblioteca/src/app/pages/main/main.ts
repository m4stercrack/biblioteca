import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Libro } from '../../interfaces/libro';
import { LibrosService } from '../../services/libros.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { User } from '@angular/fire/auth';
import { LoginService } from '../../services/login.service';
import { RouterLink } from '@angular/router';

import { NgxSpinnerModule, NgxSpinnerService } from "ngx-spinner";
import { Nuevolibro } from '../nuevolibro/nuevolibro';
import { Dialogconfirm } from '../../common/dialogconfirm/dialogconfirm';
import { ToastrModule, ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-main',
  imports: [CommonModule, FormsModule, RouterLink, NgxSpinnerModule, ToastrModule],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  usuario: User | null = null;
  termino = '';
  libros: Libro[] = [];
  cargando = true;
  menuAbierto = false;

  constructor(private librosService: LibrosService, private dialog: MatDialog, private loginService: LoginService, private sp: NgxSpinnerService, private ts: ToastrService ) { }
  async ngOnInit() {

    window.addEventListener('beforeinstallprompt', (event: any) => {
      // Evita que Chrome muestre el prompt automático
      event.preventDefault();
      // Guarda el evento para lanzarlo más tarde
      this.deferredPrompt = event;
      // Muestra el botón de instalación
      this.showButton = true;
    });


    this.sp.show();

    // 🧩 Iniciamos la sincronización
    await this.librosService.sincronizar();

    // 📡 Nos suscribimos al flujo reactivo de libros
    this.librosService.libros$.subscribe(libros => {
      this.libros = libros;
      this.cargando = false;
      this.sp.hide();
    });


    this.loginService.usuarioActual$.subscribe(user => {
      this.usuario = user;    
    });
  }


  cerrarSesion() {
    this.loginService.logout();
  }

  async buscar() {
    if (this.termino.trim() === '') {
      this.libros = await this.librosService.sincronizar();
    } else {
      this.libros = await this.librosService.buscarLocal(this.termino);
    }
  }

 

  deferredPrompt: any;
  showButton = false;




  verEjemplares(libro: Libro) {
    console.log('Ver ejemplares del libro:', libro.titulo);
    // Aquí puedes abrir un diálogo, navegar a otra ruta, o cargar los ejemplares del libro
  }





  editarLibro(libro: Libro) {
    {
      this.dialog.open(Nuevolibro, { data: libro, disableClose: true });
    }
  }

  eliminarLibro(row: Libro) {
    const dialogRef = this.dialog.open(Dialogconfirm, {
      data: {
        titulo: 'ELIMINAR LIBRO',
        mensaje: '¿Estás seguro de eliminar el libro?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {

      if (result) {
        this.librosService.eliminarLibro(row.codigo)
          .then(() => {
            this.ts.success("Libro Eliminado", "ÉXITO")
            console.log('Libro eliminado.')
          })
          .catch(err => {
            console.error('Error al eliminar:', err)
            this.ts.error("No se ha podido eliminar el libro", "ERROR")
          });
      }
    })
  }


  abrirDialogoNuevoLibro() {
    this.menuAbierto = false;
    const dialogRef = this.dialog.open(Nuevolibro, {
      width: '600px',
      disableClose: true,
      data: null // si quieres pasar un libro para editar, aquí iría el objeto Libro
    });

    dialogRef.afterClosed().subscribe(() => {
      // 🔄 Puedes recargar la lista de libros al cerrar el diálogo
      this.buscar();
    });
  }


}
