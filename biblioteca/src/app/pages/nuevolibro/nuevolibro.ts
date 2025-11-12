import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'

import { ToastrModule, ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule, NgxSpinnerService } from "ngx-spinner";

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Libro } from '../../interfaces/libro';
import { LibrosService } from '../../services/libros.service';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { ImgbbService } from '../../services/imgbb.service';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-nuevolibro',
  imports: [ToastrModule, MatButtonModule, MatIconModule, MatDialogModule, MatInputModule, ReactiveFormsModule, NgxSpinnerModule, CommonModule, FormsModule],
  templateUrl: './nuevolibro.html',
  styleUrl: './nuevolibro.css',
})
export class Nuevolibro {

  file: any;
  imageSrc: any;
  autores: string[];
  url: string;
  tipo: string;

  constructor(@Inject(MAT_DIALOG_DATA) public l: Libro, public ls: LibrosService, private toastr: ToastrService,
    private spinner: NgxSpinnerService, private dialogRef: MatDialogRef<Nuevolibro>, private imgbb: ImgbbService  ) {

    this.autores = []
    if (this.l) {
      console.log("Tiene datos");
      this.url = this.l.portada;
      this.tipo = 'editar'
    } else {
      let p: Libro = { codigo: "", titulo: "", paginas: "", autores: [], editorial: "", portada: "" };
      this.l = p;
      this.url = ""
      this.tipo = 'nuevo'
    }
  }

  formulario = new FormGroup({
    codigo: new FormControl(''),
    titulo: new FormControl('', Validators.required),
    editorial: new FormControl('', Validators.required),
    paginas: new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.maxLength(4)]),
    portada: new FormControl(''),
    autor: new FormControl('')
  })



  agregarlistautor(autor: string) {
    if ((autor.trim()).length > 0) {
      this.autores.push(autor.toUpperCase())
      this.formulario.controls.autor.reset()
    }
    else {
      this.toastr.error("Ingrese el autor\antes de agregar", "ERROR")
    }
    console.log(this.autores)
  }

  eliminarlistaautor(indice: number) {
    this.autores.splice(indice, 1)
    console.log(this.autores)
  }

  limpiar() {
    this, this.formulario.reset();
    this.autores = []
    this.imageSrc = "";
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageSrc = reader.result; 
            
      };
      reader.readAsDataURL(file);
      this.file = file;
    }
  }




    ngOnInit() {
      this.formulario.controls.codigo.setValue(this.l.codigo);
      this.formulario.controls.titulo.setValue(this.l.titulo);
      this.formulario.controls.editorial.setValue(this.l.editorial);
      this.formulario.controls.paginas.setValue(this.l.paginas);
      this.autores = this.l.autores
      this.imageSrc = this.l.portada



    }
  async guardar() {
      if (this.formulario.valid && this.autores.length > 0) {
        this.spinner.show();

        const data = <Libro>this.formulario.value;
        data.autores = this.autores;

        try {
          if (this.tipo === 'nuevo') {
            const codigoGenerado = await this.ls.generarCodigoLibro();

            if (this.file) {
              const uploadResponse = await this.imgbb.uploadImage(this.file).toPromise();
              data.portada = uploadResponse.data.url;
            } else {
              data.portada = this.url || '';
            }

            await this.ls.guardarlibroConCodigo(codigoGenerado, data);
            this.toastr.success('SE GUARDARON LOS DATOS', 'Operación satisfactoria');
          } else {
            if (this.file) {
              const uploadResponse = await this.imgbb.uploadImage(this.file).toPromise();
              data.portada = uploadResponse.data.url;
            } else {
              data.portada = this.url;
            }

            await this.ls.editarLibro(data);
            this.toastr.success('SE ACTUALIZARON LOS DATOS', 'Operación satisfactoria');
          }

          this.limpiar();
          this.dialogRef.close();
        } catch (error) {
          console.error(error);
          this.toastr.error('NO SE PUDO GUARDAR LOS DATOS', 'ERROR');
        } finally {
          this.spinner.hide();
        }
      } else {
        this.toastr.error('FALTAN DATOS O DATOS INCORRECTOS', 'ERROR');
      }
    }



  }
