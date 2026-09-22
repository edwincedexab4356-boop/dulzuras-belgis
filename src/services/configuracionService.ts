import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import { ConfiguracionNegocio } from '../types';
import { INITIAL_CONFIGURACION } from './initialData';

const LOCAL_STORAGE_KEY = 'delicias_belgi_configuracion';

const FORMAL_HERO_SUBTITULO =
  'En Delicias Belgi nos dedicamos a la alta repostería artesanal y dulcería fina, confeccionando creaciones selectas con ingredientes de primera calidad en Ciudad de Colón.';

function isLegacyText(str?: string): boolean {
  if (!str) return false;
  const lower = str.toLowerCase();
  return (
    lower.includes('bolis') ||
    lower.includes('helado') ||
    lower.includes('cremoso') ||
    lower.includes('preparada con amor')
  );
}

function sanitizeConfig(config: ConfiguracionNegocio): { config: ConfiguracionNegocio; wasCleaned: boolean } {
  let wasCleaned = false;
  const cleaned: ConfiguracionNegocio = { ...config };

  if (!cleaned.heroSubtitulo || isLegacyText(cleaned.heroSubtitulo)) {
    cleaned.heroSubtitulo = FORMAL_HERO_SUBTITULO;
    wasCleaned = true;
  }

  if (cleaned.descripcion && isLegacyText(cleaned.descripcion)) {
    cleaned.descripcion = 'Alta repostería artesanal y dulcería fina en Ciudad de Colón.';
    wasCleaned = true;
  }

  if (cleaned.presentacionTexto && isLegacyText(cleaned.presentacionTexto)) {
    cleaned.presentacionTexto =
      'Somos una dulcería y repostería artesanal en Colón. Elaboramos postres con recetas únicas, ingredientes frescos y entrega rápida a domicilio.';
    wasCleaned = true;
  }

  return { config: cleaned, wasCleaned };
}

function getLocalConfig(): ConfiguracionNegocio {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed: ConfiguracionNegocio = JSON.parse(stored);
      const { config: sanitized, wasCleaned } = sanitizeConfig(parsed);
      if (wasCleaned) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
        } catch (_) {}
      }
      return sanitized;
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  return sanitizeConfig(INITIAL_CONFIGURACION).config;
}

function saveLocalConfig(config: ConfiguracionNegocio) {
  try {
    const { config: sanitized } = sanitizeConfig(config);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event('delicias_config_changed'));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export const configuracionService = {
  subscribeToConfig(callback: (config: ConfiguracionNegocio) => void): () => void {
    // 1. Emit local config immediately
    callback(getLocalConfig());

    // 2. Always listen to local custom events for instant optimistic feedback
    const handler = () => callback(getLocalConfig());
    window.addEventListener('delicias_config_changed', handler);

    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'configuracion', 'negocio');
        unsubFirestore = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as ConfiguracionNegocio;
              const { config: sanitized, wasCleaned } = sanitizeConfig(data);
              saveLocalConfig(sanitized);
              callback(sanitized);

              // If Firestore had the legacy text, update it in Firestore cloud only if authenticated
              if (wasCleaned && auth?.currentUser) {
                setDoc(
                  docRef,
                  {
                    heroSubtitulo: sanitized.heroSubtitulo,
                    descripcion: sanitized.descripcion,
                    presentacionTexto: sanitized.presentacionTexto,
                    actualizadoEn: new Date().toISOString(),
                  },
                  { merge: true }
                ).catch((e) => {
                  console.warn('Silent note: Firestore cloud sync skipped:', e?.message || e);
                });
              }
            } else {
              callback(getLocalConfig());
            }
          },
          (error) => {
            console.warn('Firestore snapshot error on configuracion/negocio, using fallback:', error?.message || error);
            callback(getLocalConfig());
          }
        );
      } catch (err) {
        console.warn('Error setting up onSnapshot for configuracion:', err);
      }
    }

    return () => {
      window.removeEventListener('delicias_config_changed', handler);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async getConfiguracion(): Promise<ConfiguracionNegocio> {
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'configuracion', 'negocio');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const raw = snap.data() as ConfiguracionNegocio;
          const { config: sanitized, wasCleaned } = sanitizeConfig(raw);
          if (wasCleaned && auth?.currentUser) {
            try {
              await setDoc(
                docRef,
                {
                  heroSubtitulo: sanitized.heroSubtitulo,
                  descripcion: sanitized.descripcion,
                  presentacionTexto: sanitized.presentacionTexto,
                  actualizadoEn: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch (_) {}
          }
          saveLocalConfig(sanitized);
          return sanitized;
        } else {
          if (auth?.currentUser) {
            try {
              await setDoc(docRef, INITIAL_CONFIGURACION);
            } catch (_) {}
          }
          return INITIAL_CONFIGURACION;
        }
      } catch (error: any) {
        console.warn('Error fetching configuracion from Firebase, using fallback:', error?.message || error);
      }
    }
    return getLocalConfig();
  },

  async updateConfiguracion(data: Partial<ConfiguracionNegocio>): Promise<ConfiguracionNegocio> {
    const current = await this.getConfiguracion();
    const updated: ConfiguracionNegocio = {
      ...current,
      ...data,
      actualizadoEn: new Date().toISOString(),
    };

    // Save locally immediately for optimistic UI response
    saveLocalConfig(updated);

    // Save to Firestore cloud database
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'configuracion', 'negocio');
        await setDoc(docRef, updated, { merge: true });
        console.log('✅ Configuración guardada exitosamente en Firestore: configuracion/negocio');
      } catch (error: any) {
        console.error('❌ Error escribiendo configuración en Firestore:', error);
        const isPermission =
          error?.code === 'permission-denied' ||
          String(error?.message || '').toLowerCase().includes('permission');
        if (isPermission) {
          throw new Error(
            'Firestore rechazó el guardado por Reglas de Seguridad (permission-denied). Por favor revisa y actualiza las Reglas en tu Consola de Firebase.'
          );
        }
        throw new Error(error?.message || 'Error de conexión con Firestore al guardar configuración');
      }
    }

    return updated;
  },

  async actualizarConfig(data: Partial<ConfiguracionNegocio>): Promise<ConfiguracionNegocio> {
    return this.updateConfiguracion(data);
  },
  async updateConfig(data: Partial<ConfiguracionNegocio>): Promise<ConfiguracionNegocio> {
    return this.updateConfiguracion(data);
  },
  subscribeConfig(callback: (config: ConfiguracionNegocio) => void): () => void {
    return this.subscribeToConfig(callback);
  },
  subscribeToConfiguracion(callback: (config: ConfiguracionNegocio) => void): () => void {
    return this.subscribeToConfig(callback);
  },
  suscribirConfiguracion(callback: (config: ConfiguracionNegocio) => void): () => void {
    return this.subscribeToConfig(callback);
  },
  async guardarConfiguracion(data: Partial<ConfiguracionNegocio>): Promise<ConfiguracionNegocio> {
    return this.updateConfiguracion(data);
  },
};
