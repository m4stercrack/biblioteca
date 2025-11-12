import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-dialogconfirm',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './dialogconfirm.html',
  styleUrl: './dialogconfirm.css',
})
export class Dialogconfirm {

   titulo: String
  mensaje: string

  constructor(public dialogRef: MatDialogRef<Dialogconfirm>, @Inject(MAT_DIALOG_DATA) public e: any) {
    if (e) {
      this.titulo = e.titulo
      this.mensaje = e.mensaje
    } else {
      this.titulo = ""
      this.mensaje = ""
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }


}
