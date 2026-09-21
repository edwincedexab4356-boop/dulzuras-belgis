import { collection, getDocs, doc, addDoc, updateDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Producto } from '../types';
import { INITIAL_PRODUCTOS } from './initialData';
import { deduplicateById } from '../utils/deduplicate';

const LOCAL_STORAGE_KEY = 'delicias_belgi_productos';
const DELETED_PRODUCTS_KEY = 'delicias_belgi_deleted_products';

function getDeletedProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PRODUCTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function recordDeletedProductId(id: string) {
  try {
    const set = getDeletedProductIds();
    set.add(id);
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error recording deleted product id:', e);
  }
}

function normalizeProducto(id: string, data: any): Producto {
  const isDisp = data.disponible !== undefined ? Boolean(data.disponible) : (data.activo !== undefined ? Boolean(data.activo) : true);
  return {
    id,
    nombre: data.nombre || data.name || 'Producto',
    descripcion: data.descripcion || data.description || '',
    precio: Number(data.precio || data.price || 0),
    costo: data.costo !== undefined ? Number(data.costo) : 0,
    categoria: data.categoria || data.category || 'Dulcería',
    imagen: data.imagen || data.image || 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&q=80&w=800',
    disponible: isDisp,
    activo: isDisp,
    stock: data.stock !== undefined ? Number(data.stock) : 0,
    stockMinimo: data.stockMinimo !== undefined ? Number(data.stockMinimo) : 0,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

function getLocalProductos(): Producto[] {
  const deletedIds = getDeletedProductIds();
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: any[] = JSON.parse(saved);
      const filtered = parsed
        .map((p, i) => normalizeProducto(p.id || `local-${i}`, p))
        .filter((p) => !deletedIds.has(p.id!));
      return deduplicateById(filtered);
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  return [];
}

function saveLocalProductos(items: Producto[]) {
  try {
    const unique = deduplicateById(items);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(unique));
    window.dispatchEvent(new Event('delicias_productos_changed'));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export const productosService = {
  subscribeToProductos(callback: (items: Producto[]) => void): () => void {
    // 1. Emit local data immediately
    const initialLocal = getLocalProductos();
    callback(initialLocal);

    // 2. Always listen to local custom events for instant optimistic feedback
    const handler = () => callback(getLocalProductos());
    window.addEventListener('delicias_productos_changed', handler);

    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'productos');
        unsubFirestore = onSnapshot(
          colRef,
          (snapshot) => {
            const deletedIds = getDeletedProductIds();
            if (snapshot.empty) {
              saveLocalProductos([]);
              callback([]);
              return;
            }
            const list: Producto[] = [];
            snapshot.forEach((docSnap) => {
              const id = docSnap.id;
              if (deletedIds.has(id)) return;
              const data = docSnap.data();
              list.push(normalizeProducto(id, data));
            });
            const uniqueList = deduplicateById(list);
            saveLocalProductos(uniqueList);
            callback(uniqueList);
          },
          (error) => {
            console.warn('Firestore snapshot error on productos, using local fallback:', error);
            callback(getLocalProductos());
          }
        );
      } catch (err) {
        console.warn('Error setting up onSnapshot for productos:', err);
      }
    }

    return () => {
      window.removeEventListener('delicias_productos_changed', handler);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async getProductosActivos(): Promise<Producto[]> {
    const deletedIds = getDeletedProductIds();
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'productos');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list: Producto[] = [];
          snap.forEach((docSnap) => {
            const id = docSnap.id;
            if (deletedIds.has(id)) return;
            const data = docSnap.data();
            const prod = normalizeProducto(id, data);
            if (prod.disponible !== false && prod.activo !== false) {
              list.push(prod);
            }
          });
          return deduplicateById(list);
        } else {
          return [];
        }
      } catch (error) {
        console.warn('Error fetching activos from Firebase, using local fallback:', error);
      }
    }
    const local = getLocalProductos();
    return deduplicateById(local.filter((p) => p.disponible !== false && p.activo !== false));
  },

  async getAllProductos(): Promise<Producto[]> {
    const deletedIds = getDeletedProductIds();
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'productos');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list: Producto[] = [];
          snap.forEach((docSnap) => {
            const id = docSnap.id;
            if (deletedIds.has(id)) return;
            const data = docSnap.data();
            list.push(normalizeProducto(id, data));
          });
          return deduplicateById(list);
        } else {
          return [];
        }
      } catch (error) {
        console.warn('Error fetching all productos from Firebase, using fallback:', error);
      }
    }
    return getLocalProductos();
  },

  async createProducto(producto: Omit<Producto, 'id'>): Promise<Producto> {
    const now = new Date().toISOString();
    const isDisp = producto.disponible !== undefined ? Boolean(producto.disponible) : (producto.activo !== undefined ? Boolean(producto.activo) : true);
    const docPayload = {
      nombre: producto.nombre.trim(),
      descripcion: producto.descripcion ? producto.descripcion.trim() : '',
      precio: Number(producto.precio) || 0,
      costo: producto.costo !== undefined ? Number(producto.costo) : 0,
      categoria: producto.categoria?.trim() || 'Dulcería',
      imagen: producto.imagen?.trim() || 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80',
      disponible: isDisp,
      activo: isDisp,
      stock: producto.stock !== undefined ? Number(producto.stock) : 0,
      stockMinimo: producto.stockMinimo !== undefined ? Number(producto.stockMinimo) : 0,
      createdAt: producto.createdAt || now,
      updatedAt: now,
    };

    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'productos');
        const docRef = await addDoc(colRef, docPayload);
        const created: Producto = { id: docRef.id, ...docPayload };

        // Mirror in the 'inventario' collection in Firestore
        try {
          await setDoc(doc(db, 'inventario', docRef.id), {
            id: docRef.id,
            productoId: docRef.id,
            nombre: docPayload.nombre,
            categoria: docPayload.categoria,
            stock: docPayload.stock,
            stockMinimo: docPayload.stockMinimo,
            precio: docPayload.precio,
            disponible: docPayload.disponible,
            updatedAt: now,
          });
        } catch (_) {}

        const list = getLocalProductos().filter((p) => p.id !== docRef.id);
        list.unshift(created);
        saveLocalProductos(list);
        return created;
      } catch (error: any) {
        console.warn('Aviso: Error guardando en Firebase Firestore, usando respaldo local:', error?.message || error);
      }
    }

    // LocalStorage fallback
    const list = getLocalProductos();
    const newProd: Producto = {
      id: 'prod-' + Date.now(),
      ...docPayload,
    };
    const cleanList = list.filter((p) => p.id !== newProd.id);
    cleanList.unshift(newProd);
    saveLocalProductos(cleanList);
    return newProd;
  },

  async updateProducto(id: string, updates: Partial<Producto>): Promise<void> {
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      ...updates,
      updatedAt: now,
    };
    if (updates.disponible !== undefined) {
      updatePayload.activo = updates.disponible;
    } else if (updates.activo !== undefined) {
      updatePayload.disponible = updates.activo;
    }
    if (updates.precio !== undefined) {
      updatePayload.precio = Number(updates.precio) || 0;
    }
    if (updates.stock !== undefined) {
      updatePayload.stock = Math.max(0, Number(updates.stock));
    }
    if (updates.stockMinimo !== undefined) {
      updatePayload.stockMinimo = Math.max(0, Number(updates.stockMinimo));
    }

    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'productos', id);
        await setDoc(docRef, updatePayload, { merge: true });

        // Mirror in 'inventario' collection in Firestore
        try {
          const invRef = doc(db, 'inventario', id);
          const invPayload: Record<string, any> = { updatedAt: now };
          if (updatePayload.stock !== undefined) invPayload.stock = updatePayload.stock;
          if (updatePayload.stockMinimo !== undefined) invPayload.stockMinimo = updatePayload.stockMinimo;
          if (updatePayload.nombre !== undefined) invPayload.nombre = updatePayload.nombre;
          if (updatePayload.categoria !== undefined) invPayload.categoria = updatePayload.categoria;
          if (updatePayload.precio !== undefined) invPayload.precio = updatePayload.precio;
          if (updatePayload.disponible !== undefined) invPayload.disponible = updatePayload.disponible;
          await setDoc(invRef, invPayload, { merge: true });
        } catch (_) {}
      } catch (error: any) {
        console.warn('Aviso: Producto actualizado en almacenamiento local (Firestore usando fallback):', error?.message || error);
      }
    }

    // LocalStorage fallback sync
    const list = getLocalProductos();
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatePayload };
      saveLocalProductos(list);
    }
  },

  async toggleActivo(id: string, currentStatus: boolean): Promise<void> {
    await this.updateProducto(id, { disponible: !currentStatus, activo: !currentStatus });
  },

  async deleteProducto(id: string): Promise<{ success: boolean; deletedInFirebase: boolean }> {
    recordDeletedProductId(id);
    let deletedInFirebase = false;

    if (isFirebaseConfigured() && db && id) {
      try {
        const docRef = doc(db, 'productos', id);
        await deleteDoc(docRef);
        deletedInFirebase = true;
        try {
          const invRef = doc(db, 'inventario', id);
          await deleteDoc(invRef);
        } catch (_) {}
        try {
          const legRef = doc(db, 'products', id);
          await deleteDoc(legRef);
        } catch (_) {}
      } catch (error: any) {
        console.warn('Aviso: Producto eliminado en almacenamiento local (Firestore usando fallback):', error?.message || error);
      }
    }

    const list = getLocalProductos();
    const filtered = list.filter((p) => p.id !== id);
    saveLocalProductos(filtered);

    return { success: true, deletedInFirebase };
  },

  // Aliases
  async crearProducto(producto: Omit<Producto, 'id'>): Promise<Producto> {
    return this.createProducto(producto);
  },
  async actualizarProducto(id: string, updates: Partial<Producto>): Promise<void> {
    return this.updateProducto(id, updates);
  },
  async eliminarProducto(id: string): Promise<{ success: boolean; deletedInFirebase: boolean }> {
    return this.deleteProducto(id);
  },
  async duplicarProducto(producto: Producto): Promise<Producto> {
    const copyData: Omit<Producto, 'id'> = {
      nombre: `${producto.nombre} (Copia)`,
      descripcion: producto.descripcion || '',
      precio: Number(producto.precio) || 0,
      categoria: producto.categoria || 'Dulcería',
      imagen: producto.imagen || '',
      disponible: producto.disponible !== undefined ? producto.disponible : true,
      activo: producto.activo !== undefined ? producto.activo : true,
      stock: producto.stock !== undefined ? Number(producto.stock) : 0,
      stockMinimo: producto.stockMinimo !== undefined ? Number(producto.stockMinimo) : 0,
    };
    return this.createProducto(copyData);
  },
  subscribeProductos(callback: (items: Producto[]) => void): () => void {
    return this.subscribeToProductos(callback);
  },
  suscribirProductos(callback: (items: Producto[]) => void): () => void {
    return this.subscribeToProductos(callback);
  },
  async getProductoById(id: string): Promise<Producto | null> {
    const all = await this.getAllProductos();
    return all.find((p) => p.id === id) || null;
  },
  limpiarTodosLosProductos(): void {
    saveLocalProductos([]);
  },
};
