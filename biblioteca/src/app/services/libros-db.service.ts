import { Injectable } from '@angular/core';
import { openDB, DBSchema } from 'idb';
import { Libro } from '../interfaces/libro';

interface BibliotecaDB extends DBSchema {
  libros: {
    key: string;
    value: Libro;
  };
  metadatos: {
    key: string;
    value: { key: string; version: number; fecha: string }; 
  };
}

@Injectable({
  providedIn: 'root',
})
export class LibrosDbService {
  private dbPromise = openDB<BibliotecaDB>('biblioteca-db', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('libros')) {
        db.createObjectStore('libros', { keyPath: 'codigo' });
      }
      if (!db.objectStoreNames.contains('metadatos')) {
        db.createObjectStore('metadatos', { keyPath: 'key' });
      }
    },
  });



    async guardarLibros(libros: Libro[],) {
    const db = await this.dbPromise;
    const tx = db.transaction(['libros', 'metadatos'], 'readwrite');

    await tx.objectStore('libros').clear();
    for (const libro of libros) await tx.objectStore('libros').put(libro);


    await tx.done;
  }

  async obtenerTodos(): Promise<Libro[]> {
    const db = await this.dbPromise;
    return db.getAll('libros');
  }

  async obtenerVersion(): Promise<number> {
    const db = await this.dbPromise;
    const data = await db.get('metadatos', 'version_libros');
    return data?.version ?? 0;
  }

  async limpiar() {
    const db = await this.dbPromise;
    await db.clear('libros');
  }

  async agregarLibro(libro: Libro) {
    const db = await this.dbPromise;
    await db.put('libros', libro);
  }

  async actualizarLibro(id: string, libro: Libro) {
    const db = await this.dbPromise;
    await db.put('libros', libro);
  }

  async eliminarLibro(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('libros', id);
    console.log(`Libro ${id} eliminado de la base local (IndexedDB).`);
  }
}
