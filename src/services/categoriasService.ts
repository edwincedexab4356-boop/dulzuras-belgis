import {
  collection,
  doc,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Categoria } from '../types';
import { deduplicateById } from '../utils/deduplicate';

const LOCAL_STORAGE_KEY = 'delicias_belgi_categorias';
const DELETED_CATEGORIAS_KEY = 'delicias_belgi_deleted_categorias';

const INITIAL_CATEGORIAS: Categoria[] = [
  { id: 'cat-1', nombre: 'Dulcería', descripcion: 'Alfajores, brownies y bocadillos dulces', activa: true, orden: 1 },
  { id: 'cat-2', nombre: 'Repostería', descripcion: 'Tartas, cheesecakes y pasteles finos', activa: true, orden: 2 },
  { id: 'cat-3', nombre: 'Postres Especiales', descripcion: 'Creaciones artesanales de la casa', activa: true, orden: 3 },
  { id: 'cat-4', nombre: 'Bebidas', descripcion: 'Café, sodas y jugos naturales', activa: true, orden: 4 },
  { id: 'cat-5', nombre: 'Combos & Especiales', descripcion: 'Paquetes para compartir y creaciones de temporada', activa: true, orden: 5 },
];

function getDeletedCategoriaIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_CATEGORIAS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function recordDeletedCategoriaId(id: string) {
  try {
    const set = getDeletedCategoriaIds();
    set.add(id);
    localStorage.setItem(DELETED_CATEGORIAS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error recording deleted categoria id:', e);
  }
}

function getLocalCategorias(): Categoria[] {
  const deletedIds = getDeletedCategoriaIds();
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved !== null) {
      const parsed: Categoria[] = JSON.parse(saved);
      return deduplicateById(parsed.filter((c) => !c.id || !deletedIds.has(c.id)));
    }
  } catch (e) {
    console.warn('LocalStorage error reading categorias:', e);
  }
  return deduplicateById(INITIAL_CATEGORIAS.filter((c) => !c.id || !deletedIds.has(c.id)));
}

function saveLocalCategorias(items: Categoria[]) {
  try {
    const unique = deduplicateById(items);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(unique));
    window.dispatchEvent(new Event('delicias_categorias_changed'));
  } catch (e) {
    console.warn('LocalStorage error saving categorias:', e);
  }
}

export const categoriasService = {
  subscribeToCategorias(callback: (items: Categoria[]) => void): () => void {
    // 1. Emit local data immediately
    const initialLocal = getLocalCategorias();
    callback(initialLocal);

    // 2. Always listen to local custom events for instant optimistic updates
    const handler = () => callback(getLocalCategorias());
    window.addEventListener('delicias_categorias_changed', handler);

    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'categorias');
        unsubFirestore = onSnapshot(
          colRef,
          async (snapshot) => {
            const deletedIds = getDeletedCategoriaIds();
            if (snapshot.empty) {
              const local = getLocalCategorias();
              callback(local);
              // Auto-seed into Firestore so the 'categorias' collection appears in Firestore console
              if (db) {
                try {
                  for (const c of local) {
                    const catId = c.id || `cat-${Date.now()}`;
                    await setDoc(doc(db, 'categorias', catId), {
                      nombre: c.nombre,
                      descripcion: c.descripcion || '',
                      imagen: c.imagen || '',
                      activa: c.activa !== false,
                      orden: Number(c.orden) || 1,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                  }
                } catch (seedErr) {
                  console.warn('Aviso: Sincronizando categorías con Firestore:', seedErr);
                }
              }
              return;
            }
            const list: Categoria[] = [];
            snapshot.forEach((d) => {
              if (deletedIds.has(d.id)) return;
              const data = d.data();
              list.push({
                id: d.id,
                nombre: data.nombre || 'Categoría',
                descripcion: data.descripcion || '',
                imagen: data.imagen || '',
                activa: data.activa !== undefined ? Boolean(data.activa) : true,
                orden: Number(data.orden) || 0,
                createdAt: data.createdAt || '',
                updatedAt: data.updatedAt || '',
              });
            });
            list.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
            const uniqueList = deduplicateById(list);
            saveLocalCategorias(uniqueList);
            callback(uniqueList);
          },
          (error) => {
            console.warn('Error onSnapshot categorias, using fallback:', error);
            callback(getLocalCategorias());
          }
        );
      } catch (err) {
        console.warn('Error setting up onSnapshot for categorias:', err);
      }
    }

    return () => {
      window.removeEventListener('delicias_categorias_changed', handler);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async getCategorias(): Promise<Categoria[]> {
    const deletedIds = getDeletedCategoriaIds();
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'categorias');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list: Categoria[] = [];
          snap.forEach((d) => {
            if (deletedIds.has(d.id)) return;
            const data = d.data();
            list.push({ id: d.id, ...(data as any) });
          });
          list.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
          return list;
        }
      } catch (err) {
        console.warn('Error getting categorias from Firestore:', err);
      }
    }
    return getLocalCategorias();
  },

  async createCategoria(cat: Omit<Categoria, 'id'>): Promise<Categoria> {
    const now = new Date().toISOString();
    const payload = {
      nombre: cat.nombre.trim(),
      descripcion: cat.descripcion?.trim() || '',
      imagen: cat.imagen?.trim() || '',
      activa: cat.activa !== undefined ? Boolean(cat.activa) : true,
      orden: Number(cat.orden) || 0,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'categorias');
        const docRef = await addDoc(colRef, payload);
        const created: Categoria = { id: docRef.id, ...payload };
        const localList = getLocalCategorias().filter((c) => c.id !== docRef.id);
        localList.push(created);
        saveLocalCategorias(localList);
        return created;
      } catch (error: any) {
        console.warn('Aviso: Categoría guardada en almacenamiento local (Firestore usando fallback):', error?.message || error);
      }
    }

    const created: Categoria = { id: 'cat-' + Date.now(), ...payload };
    const localList = getLocalCategorias().filter((c) => c.id !== created.id);
    localList.push(created);
    saveLocalCategorias(localList);
    return created;
  },

  async updateCategoria(id: string, updates: Partial<Categoria>): Promise<void> {
    const now = new Date().toISOString();
    const payload = {
      ...updates,
      updatedAt: now,
    };

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'categorias', id);
        await updateDoc(docRef, payload);
        return;
      } catch (error: any) {
        console.warn('Aviso: Categoría actualizada en almacenamiento local (Firestore usando fallback):', error?.message || error);
      }
    }

    const list = getLocalCategorias();
    const index = list.findIndex((c) => c.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...payload };
      saveLocalCategorias(list);
    }
  },

  async deleteCategoria(id: string): Promise<{ success: boolean; deletedInFirebase: boolean }> {
    recordDeletedCategoriaId(id);
    let deletedInFirebase = false;

    if (isFirebaseConfigured() && db && id) {
      try {
        const docRef = doc(db, 'categorias', id);
        await deleteDoc(docRef);
        deletedInFirebase = true;
      } catch (error: any) {
        console.warn('Aviso: Categoría eliminada localmente (Firestore usando fallback):', error?.message || error);
      }
    }

    const list = getLocalCategorias().filter((c) => c.id !== id);
    saveLocalCategorias(list);
    return { success: true, deletedInFirebase };
  },

  subscribeCategorias(callback: (items: Categoria[]) => void): () => void {
    return this.subscribeToCategorias(callback);
  },
  suscribirCategorias(callback: (items: Categoria[]) => void): () => void {
    return this.subscribeToCategorias(callback);
  },
  async crearCategoria(cat: Omit<Categoria, 'id'>): Promise<Categoria> {
    return this.createCategoria(cat);
  },
  async actualizarCategoria(id: string, updates: Partial<Categoria>): Promise<void> {
    return this.updateCategoria(id, updates);
  },
  async sincronizarCategoriasConFirestore(items?: Categoria[]): Promise<void> {
    if (!isFirebaseConfigured() || !db) return;
    const listToSync = items && items.length > 0 ? items : getLocalCategorias();
    try {
      for (const cat of listToSync) {
        const catId = cat.id || `cat-${Date.now()}`;
        await setDoc(
          doc(db, 'categorias', catId),
          {
            id: catId,
            nombre: cat.nombre,
            descripcion: cat.descripcion || '',
            imagen: cat.imagen || '',
            activa: cat.activa !== false,
            orden: Number(cat.orden) || 1,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Error sincronizando categorías con Firestore:', err);
    }
  },
  async eliminarCategoria(id: string): Promise<{ success: boolean; deletedInFirebase: boolean }> {
    return this.deleteCategoria(id);
  },
};
