import { Injectable } from '@angular/core';
import { Firestore, collection, deleteDoc, doc, getDocs, onSnapshot, query, runTransaction, updateDoc, where } from '@angular/fire/firestore';
import { Libro } from '../interfaces/libro';
import { LibrosDbService } from './libros-db.service';
import { BehaviorSubject } from 'rxjs';

interface PerfilConfig {
  contador: number;
}

@Injectable({
  providedIn: 'root',
})
export class LibrosService {

  public libros$ = new BehaviorSubject<Libro[]>([]);
  private unsubscribeLibros?: () => void;
  constructor(private firestore: Firestore, private db: LibrosDbService) {

  }

  async sincronizar(): Promise<Libro[]> {
    let librosLocales = await this.db.obtenerTodos();

    // Si no hay libros locales, descarga toda la colección
    if (librosLocales.length === 0) {
      if (!navigator.onLine) {
        console.warn('Sin conexión — no se puede sincronizar.');
        this.libros$.next(librosLocales);
        return librosLocales;
      }

      console.log('Descargando colección completa desde Firestore...');
      const ref = collection(this.firestore, 'LIBROS');
      const snapshot = await getDocs(ref);
      const librosRemotos = snapshot.docs.map(d => d.data() as Libro);

      await this.db.guardarLibros(librosRemotos);
      librosLocales = librosRemotos;
      console.log(`Cache local actualizada con ${librosRemotos.length} libros.`);
    } else {
      console.log('Usando cache local existente.');
    }

    // Emitir datos locales
    this.libros$.next(librosLocales);

    // Configurar listener incremental
    if (!this.unsubscribeLibros && navigator.onLine) {
      const ref = collection(this.firestore, 'LIBROS');
      let primeraVez = true;

      this.unsubscribeLibros = onSnapshot(ref, async snapshot => {
        if (primeraVez) {
          primeraVez = false;
          console.log('Listener Firestore inicializado (sin duplicar carga).');
          return;
        }

        let cambios = false;

        for (const change of snapshot.docChanges()) {
          const libro = change.doc.data() as Libro;

          switch (change.type) {
            case 'added':
              await this.db.agregarLibro(libro);
              console.log(`Libro agregado: ${libro.titulo}`);
              cambios = true;
              break;
            case 'modified':
              await this.db.actualizarLibro(libro.codigo, libro);
              console.log(`Libro modificado: ${libro.titulo}`);
              cambios = true;
              break;
            case 'removed':
              await this.db.eliminarLibro(libro.codigo);
              console.log(`Libro eliminado: ${libro.titulo}`);
              cambios = true;
              break;
          }
        }

        if (cambios) {
          const actualizados = await this.db.obtenerTodos();
          this.libros$.next(actualizados);
          console.log('Cache local actualizada incrementalmente.');
        }
      });
    }

    return librosLocales;
  }

  ngOnDestroy() {
    this.unsubscribeLibros?.();

  }

  async buscarLocal(termino: string): Promise<Libro[]> {
    const libros: Libro[] = await this.db.obtenerTodos();
    termino = termino.toLowerCase();

    return libros.filter((l: Libro) => {
      const titulo = l.titulo?.toLowerCase() || '';
      const codigo = l.codigo?.toLowerCase() || '';
      const autores = (l.autores ?? []).join(' ').toLowerCase();

      return (
        titulo.includes(termino) ||
        codigo.includes(termino) ||
        autores.includes(termino)
      );
    });
  }

  /**Guardar libro con transacción */
  async guardarlibro(data: Libro) {
    const perfilRef = doc(this.firestore, 'CONFIGURACIONES/PERFIL');

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const perfilSnap = await transaction.get(perfilRef);

        // Si el documento no existe, se crea con contador = 0
        if (!perfilSnap.exists()) {
          transaction.set(perfilRef, { contador: 0 });
          console.log('Documento PERFIL creado automáticamente.');
        }

        // Obtener los datos actualizados (si no existía, contador = 0)
        const perfilData = (perfilSnap.exists()
          ? perfilSnap.data()
          : { contador: 0 }) as PerfilConfig;

        const contadorActual = perfilData.contador ?? 0;
        const nuevoContador = contadorActual + 1;
        const anioActual = new Date().getFullYear();
        const codigoGenerado = `${nuevoContador}${anioActual}`;

        // Actualizar el contador
        transaction.update(perfilRef, { contador: nuevoContador });

        // Crear documento del libro
        const libroRef = doc(this.firestore, `LIBROS/${codigoGenerado}`);
        transaction.set(libroRef, {
          codigo: codigoGenerado,
          titulo: data.titulo.toUpperCase(),
          editorial: data.editorial.toUpperCase(),
          paginas: data.paginas,
          portada: data.portada,
          autores: data.autores,
        });

        // Crear documento de tema inicial
        const temaRef = doc(this.firestore, `TEMAS/${crypto.randomUUID()}`);
        transaction.set(temaRef, {
          tema: data.titulo.toUpperCase(),
          codigoLibro: codigoGenerado,
          pagina: 0,
        });
      });

      console.log('✅ Libro guardado correctamente.');
    } catch (error) {
      console.error('❌ Error al guardar libro:', error);
    }
  }


  async editarLibro(data: Libro) {
    try {
      const libroRef = doc(this.firestore, `LIBROS/${data.codigo}`);
      await updateDoc(libroRef, {
        titulo: data.titulo.toUpperCase(),
        editorial: data.editorial.toUpperCase(),
        paginas: data.paginas,
        portada: data.portada,
        autores: data.autores
      });
      console.log('Libro actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar libro:', error);
    }
  }

  async generarCodigoLibro(): Promise<string> {
    const perfilRef = doc(this.firestore, 'CONFIGURACIONES/PERFIL');

    return runTransaction(this.firestore, async (transaction) => {
      const perfilSnap = await transaction.get(perfilRef);

      // Si no existe el documento PERFIL, se crea con contador = 0
      if (!perfilSnap.exists()) {
        transaction.set(perfilRef, { contador: 1000 });
        console.log('Documento PERFIL creado automáticamente.');
      }

      // Tomar los datos actuales (si no existía, contador = 0)
      const perfilData = (perfilSnap.exists()
        ? perfilSnap.data()
        : { contador: 0 }) as PerfilConfig;

      const contadorActual = perfilData.contador ?? 0;
      const nuevoContador = contadorActual + 1;
      const anioActual = new Date().getFullYear();
      const codigoGenerado = `${nuevoContador}${anioActual}`;

      // Actualizar el contador
      transaction.update(perfilRef, { contador: nuevoContador });

      return codigoGenerado;
    });
  }


  async guardarlibroConCodigo(codigo: string, data: Libro) {
    try {
      await runTransaction(this.firestore, async (transaction) => {
        const libroRef = doc(this.firestore, `LIBROS/${codigo}`);
        transaction.set(libroRef, {
          codigo,
          titulo: data.titulo.toUpperCase(),
          editorial: data.editorial.toUpperCase(),
          paginas: data.paginas,
          portada: data.portada,
          autores: data.autores
        });

        const temaRef = doc(this.firestore, `TEMAS/${crypto.randomUUID()}`);
        transaction.set(temaRef, {
          tema: data.titulo.toUpperCase(),
          codigoLibro: codigo,
          pagina: 0
        });
      });

      console.log('Libro guardado correctamente con código.');
    } catch (error) {
      console.error('Error al guardar libro:', error);
      throw error;
    }
  }


  async eliminarLibro(id: string): Promise<void> {
    try {
      const libroRef = doc(this.firestore, `LIBROS/${id}`);

      // Eliminar subcolección EJEMPLARES
      const ejemplaresRef = collection(this.firestore, `LIBROS/${id}/EJEMPLARES`);
      const ejemplaresSnap = await getDocs(ejemplaresRef);
      for (const ejemplar of ejemplaresSnap.docs) {
        await deleteDoc(ejemplar.ref);
      }

      // Eliminar los temas relacionados
      const temasRef = collection(this.firestore, 'TEMAS');
      const temasSnap = await getDocs(query(temasRef, where('codigoLibro', '==', id)));
      for (const tema of temasSnap.docs) {
        await deleteDoc(tema.ref);
      }

      // Eliminar el libro principal
      await deleteDoc(libroRef);

      //Eliminar también del almacenamiento local
      await this.db.eliminarLibro(id);

      console.log(`Libro ${id} eliminado correctamente en Firestore y local.`);
    } catch (error) {
      console.error('Error al eliminar libro y subcolecciones:', error);
    }
  }

}
