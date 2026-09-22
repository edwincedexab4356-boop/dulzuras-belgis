import React, { useState, useMemo } from 'react';
import {
  Settings,
  Save,
  Check,
  Building,
  Phone,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  Tag,
  Eye,
  X,
  Gift,
  Users,
  Database,
  Copy,
  FileCode,
  Search,
  CheckSquare,
  Square,
  CloudUpload,
  Info,
} from 'lucide-react';
import { ConfiguracionNegocio, HorariosSemana, Producto } from '../../types';
import { configuracionService } from '../../services/configuracionService';
import { isFirebaseConfigured } from '../../services/firebase';
import { seedInitialData } from '../../services/initialData';
import { formatCurrency } from '../../utils/formatters';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { CajerosManager } from './CajerosManager';

interface ConfiguracionViewProps {
  config: ConfiguracionNegocio;
  productos?: Producto[];
  onRefreshData?: () => void;
}

const DIAS_KEYS: { key: keyof HorariosSemana; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const FORMAL_HERO_SUBTITULO =
  'En Delicias Belgi nos dedicamos a la alta repostería artesanal y dulcería fina, confeccionando creaciones selectas con ingredientes de primera calidad en Ciudad de Colón.';

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  config,
  productos = [],
  onRefreshData,
}) => {
  const initialCleanSubtitulo =
    !config.heroSubtitulo ||
    config.heroSubtitulo.toLowerCase().includes('bolis') ||
    config.heroSubtitulo.toLowerCase().includes('helado') ||
    config.heroSubtitulo.toLowerCase().includes('preparada con amor')
      ? FORMAL_HERO_SUBTITULO
      : config.heroSubtitulo;

  const [formData, setFormData] = useState<ConfiguracionNegocio>({
    ...config,
    heroSubtitulo: initialCleanSubtitulo,
    promocionProductosIds: config.promocionProductosIds || [],
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRulesGuide, setShowRulesGuide] = useState(false);
  const [showFirestoreMap, setShowFirestoreMap] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [promoSearch, setPromoSearch] = useState('');
  const [promoCategory, setPromoCategory] = useState('Todas');

  const firebaseReady = isFirebaseConfigured();

  const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const promoCategories = useMemo(() => {
    const set = new Set<string>();
    (productos || []).forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return ['Todas', ...Array.from(set)];
  }, [productos]);

  const filteredPromoProducts = useMemo(() => {
    return (productos || []).filter((p) => {
      const matchCat = promoCategory === 'Todas' || p.categoria === promoCategory;
      const matchSearch =
        p.nombre.toLowerCase().includes(promoSearch.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(promoSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productos, promoCategory, promoSearch]);

  const selectedPromoIds = formData.promocionProductosIds || [];

  const handleTogglePromoProduct = (prodId?: string) => {
    if (!prodId) return;
    const current = new Set(formData.promocionProductosIds || []);
    if (current.has(prodId)) {
      current.delete(prodId);
    } else {
      current.add(prodId);
    }
    setFormData((prev) => ({
      ...prev,
      promocionProductosIds: Array.from(current),
    }));
  };

  const handleSelectAllPromo = () => {
    const allIds = (productos || []).map((p) => p.id).filter(Boolean) as string[];
    setFormData((prev) => ({
      ...prev,
      promocionProductosIds: allIds,
    }));
  };

  const handleClearAllPromo = () => {
    setFormData((prev) => ({
      ...prev,
      promocionProductosIds: [],
    }));
  };

  const handleForceSyncFirestore = async () => {
    setSyncingFirestore(true);
    setErrorMsg(null);
    try {
      await configuracionService.guardarConfiguracion(formData);
      setSuccessMsg(
        '¡Sincronización Exitosa! Toda la configuración y promociones se han guardado directamente en Firestore (Colección: "configuracion" > Documento: "negocio").'
      );
      onRefreshData?.();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setErrorMsg('Error de sincronización con Firestore: ' + (err.message || 'Error desconocido'));
    } finally {
      setSyncingFirestore(false);
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
    setRulesCopied(true);
    setTimeout(() => setRulesCopied(false), 3000);
  };

  const handleHorarioChange = (
    dia: keyof HorariosSemana,
    field: 'activo' | 'apertura' | 'cierre',
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...(prev.horarios?.[dia] || { activo: true, apertura: '09:00', cierre: '19:30' }),
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      setErrorMsg(null);
      await configuracionService.guardarConfiguracion(formData);
      setSuccessMsg('Configuración guardada exitosamente.');
      onRefreshData?.();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg('Error al guardar configuración: ' + (err.message || 'Error desconocido'));
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemoData = () => {
    if (!window.confirm('¿Deseas restablecer los datos de demostración de Delicias Belgi?')) return;
    seedInitialData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-600" />
            <span>Configuración del Negocio</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Personaliza la identidad de Delicias Belgi, horarios, teléfono, WhatsApp y ubicación.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Cloud Firestore Status & Rules Helper */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-stone-900">
                  Base de Datos en la Nube (Firebase Firestore)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {firebaseReady ? 'Conectado (delicias-belgis)' : 'Modo Local'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Al guardar, los datos se sincronizan directamente con Firestore. Si experimentas problemas al guardar, verifica las <strong>Reglas de Seguridad</strong> en Firebase Console.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleForceSyncFirestore}
              disabled={syncingFirestore}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Guardar y forzar subida directa a Firestore en la nube"
            >
              <CloudUpload className="w-3.5 h-3.5 text-emerald-700" />
              <span>{syncingFirestore ? 'Sincronizando...' : 'Sincronizar a Firestore Ahora'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFirestoreMap(!showFirestoreMap)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-700" />
              <span>{showFirestoreMap ? 'Ocultar Dónde se Guarda' : '¿Dónde se guarda en Firestore?'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRulesGuide(!showRulesGuide)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{showRulesGuide ? 'Ocultar Reglas' : 'Reglas de Seguridad'}</span>
            </button>
          </div>
        </div>

        {/* GUÍA DE MAPEO: DÓNDE SE GUARDA CADA DATO EN FIRESTORE */}
        {showFirestoreMap && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2 text-xs text-stone-700">
            <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <Database className="w-4 h-4 text-amber-600" />
                <span>Estructura de Almacenamiento en tu Consola de Firebase Firestore:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-mono font-bold text-pink-700 block">📁 Colección: "configuracion" ➡️ Documento: "negocio"</span>
                  <p className="text-stone-600">
                    Guarda teléfono, WhatsApp, logo, 4 fotos de historia, horarios, textos de ofertas y la lista de <strong>IDs de postres en promoción (promocionProductosIds)</strong>.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-mono font-bold text-pink-700 block">📁 Colección: "usuarios" ➡️ Documentos por ID</span>
                  <p className="text-stone-600">
                    Guarda los perfiles del personal, nombre, correo, estado activo y rol (<strong>ADMINISTRADOR</strong> o <strong>CAJERO</strong>).
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-mono font-bold text-pink-700 block">📁 Colección: "productos" ➡️ Documentos por ID</span>
                  <p className="text-stone-600">
                    Guarda cada postre, alfajor, torta o dulce: nombre, categoría, precio, stock y foto.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <span className="font-mono font-bold text-pink-700 block">📁 Colección: "ventas" ➡️ Documentos por ID</span>
                  <p className="text-stone-600">
                    Guarda cada ticket facturado por el cajero: cliente, items, fecha, total y método de pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRulesGuide && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-3 text-xs text-stone-700">
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>¿Por qué debes configurar las Reglas en Firebase Console?</span>
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Por defecto, una base de datos recién creada en Firebase bloquea toda escritura externa con el error <code>permission-denied</code> o expira a los 30 días si se creó en modo de prueba. Para que la app pueda guardar usuarios y configuración en Firestore sin bloqueos, debes actualizar las reglas:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-[11px] text-stone-700">
                <li>Ve a <strong>console.firebase.google.com</strong> e ingresa a tu proyecto <strong>delicias-belgis</strong>.</li>
                <li>En el menú izquierdo, ve a <strong>Firestore Database</strong> y haz clic en la pestaña <strong>Reglas (Rules)</strong>.</li>
                <li>Pega las siguientes reglas y haz clic en <strong>Publicar (Publish)</strong>:</li>
              </ol>

              <div className="relative mt-2">
                <pre className="p-3 rounded-lg bg-stone-900 text-amber-400 font-mono text-[10px] overflow-x-auto select-all">
                  {FIRESTORE_RULES_TEXT}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-white text-[10px] font-bold flex items-center gap-1 border border-stone-700 cursor-pointer"
                >
                  {rulesCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{rulesCopied ? '¡Copiado!' : 'Copiar Reglas'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Identidad y Textos */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Building className="w-5 h-5 text-amber-800" />
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Identidad de la Marca
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Nombre del Negocio
              </label>
              <input
                type="text"
                required
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Eslogan Oficial
              </label>
              <input
                type="text"
                placeholder="Repostería para todos tus eventos!!"
                value={formData.eslogan || ''}
                onChange={(e) => setFormData({ ...formData, eslogan: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Aviso de Marca Registrada (Pie de página y portada)
              </label>
              <input
                type="text"
                placeholder="Marca debidamente registrada en el Registro Público de Panamá"
                value={formData.marcaRegistradaTexto || ''}
                onChange={(e) => setFormData({ ...formData, marcaRegistradaTexto: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Descripción Breve de la Marca
              </label>
              <input
                type="text"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Historia / Presentación en la Tienda Pública
            </label>
            <textarea
              rows={3}
              value={formData.presentacionTexto || ''}
              onChange={(e) => setFormData({ ...formData, presentacionTexto: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Título Principal de la Portada (Hero)
              </label>
              <input
                type="text"
                placeholder="El sabor artesanal que alegra tus mejores momentos"
                value={formData.heroTitulo || ''}
                onChange={(e) => setFormData({ ...formData, heroTitulo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Subtítulo / Mensaje de Portada (Hero)
              </label>
              <textarea
                rows={2}
                placeholder="En Delicias Belgi nos dedicamos a la alta repostería artesanal..."
                value={formData.heroSubtitulo || ''}
                onChange={(e) => setFormData({ ...formData, heroSubtitulo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Pestañas y Banners de Promociones (Editable desde el Administrador) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600" />
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Pestaña y Banner de Promociones
                </h3>
                <p className="text-xs text-stone-500">
                  Configura ofertas especiales, avisos destacados y botones promocionales para tus clientes.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.promocionActiva !== false}
                onChange={(e) => setFormData({ ...formData, promocionActiva: e.target.checked })}
                className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
              />
              <span className="text-xs font-bold text-stone-700">
                {formData.promocionActiva !== false ? 'Promoción Visible' : 'Oculta'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Etiqueta / Badge de la Pestaña
              </label>
              <input
                type="text"
                placeholder="PROMO DEL DÍA"
                value={formData.promocionBadge || ''}
                onChange={(e) => setFormData({ ...formData, promocionBadge: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Título de la Promoción
              </label>
              <input
                type="text"
                placeholder="20% OFF en postres selectos para tus eventos"
                value={formData.promocionTitulo || ''}
                onChange={(e) => setFormData({ ...formData, promocionTitulo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Mensaje o Descripción de la Oferta
              </label>
              <input
                type="text"
                placeholder="Endulza tus celebraciones especiales con nuestras creaciones artesanales frescas."
                value={formData.promocionTexto || ''}
                onChange={(e) => setFormData({ ...formData, promocionTexto: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Texto del Botón de la Oferta
              </label>
              <input
                type="text"
                placeholder="Aprovechar Oferta por WhatsApp"
                value={formData.promocionBotonTexto || ''}
                onChange={(e) => setFormData({ ...formData, promocionBotonTexto: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Descuento / Código Destacado (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ejemplo: 20% OFF o Cupón: EVENTOS2026"
                value={formData.promocionDescuento || ''}
                onChange={(e) => setFormData({ ...formData, promocionDescuento: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Aparece destacado en la tarjeta flotante para llamar la atención del cliente.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Foto / Imagen de la Promoción (Opcional)
              </label>
              <ImageUploadInput
                label="Imagen promocional"
                value={formData.promocionImagenUrl || ''}
                onChange={(val) => setFormData({ ...formData, promocionImagenUrl: val })}
                placeholder="URL de la imagen o presiona Subir Foto"
              />
            </div>
          </div>

          {/* SELECCIÓN DE PRODUCTOS EN PROMOCIÓN DESDE EL ADMIN */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-pink-600" />
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Elegir Productos que Están en Promoción
                  </h4>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Marca con un clic qué postres entran en esta promoción. Se mostrarán con insignia de oferta y en el anuncio flotante.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllPromo}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors cursor-pointer"
                >
                  Seleccionar Todos ({productos.length})
                </button>
                <button
                  type="button"
                  onClick={handleClearAllPromo}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Deseleccionar
                </button>
              </div>
            </div>

            {/* Contador de seleccionados */}
            <div className="p-3 rounded-xl bg-pink-50/70 border border-pink-200/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-pink-950">
                Productos seleccionados para la promoción:{' '}
                <strong className="text-pink-700 text-sm font-bold">
                  {selectedPromoIds.length}
                </strong>
              </span>
              {selectedPromoIds.length > 0 && (
                <span className="text-[11px] text-pink-800 bg-white/80 px-2 py-0.5 rounded-full border border-pink-200 font-bold">
                  Visible en anuncio flotante y menú
                </span>
              )}
            </div>

            {/* Buscador y filtro por categoría */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar postre para agregar a la promoción..."
                  value={promoSearch}
                  onChange={(e) => setPromoSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {promoCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPromoCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      promoCategory === cat
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de selección interactiva */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredPromoProducts.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  No se encontraron postres con ese criterio de búsqueda.
                </div>
              ) : (
                filteredPromoProducts.map((prod) => {
                  const isSelected = selectedPromoIds.includes(prod.id || '');
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleTogglePromoProduct(prod.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 select-none ${
                        isSelected
                          ? 'bg-pink-50/90 border-pink-400 shadow-xs ring-1 ring-pink-400/40'
                          : 'bg-white border-stone-200 hover:border-pink-200 hover:bg-stone-50/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        {prod.imagen ? (
                          <img
                            src={prod.imagen}
                            alt={prod.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Tag className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className="font-serif text-xs font-bold text-stone-900 truncate">
                          {prod.nombre}
                        </h5>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                          <span className="font-semibold text-pink-700">
                            {formatCurrency(prod.precio)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{prod.categoria}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-pink-600">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-pink-600 text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-300" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Badges de productos seleccionados */}
            {selectedPromoIds.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                  Postres activos en esta promoción ({selectedPromoIds.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPromoIds.map((id) => {
                    const prod = productos.find((p) => p.id === id);
                    if (!prod) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 border border-pink-300 text-pink-900 text-xs shadow-2xs font-medium"
                      >
                        <span className="font-serif font-bold truncate max-w-[140px]">
                          {prod.nombre}
                        </span>
                        <span className="text-[10px] text-pink-600 font-bold">
                          {formatCurrency(prod.precio)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePromoProduct(id);
                          }}
                          className="hover:text-rose-600 cursor-pointer ml-0.5 text-stone-400"
                          title="Quitar de la promoción"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Información y Vista Previa de la Pestaña Flotante */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/70 to-rose-50/40 border border-pink-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-900">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span>Comportamiento Flotante en la Web Pública</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-bold">
                Automático en entrada
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Al ingresar a la tienda online, la <strong>tarjeta de promoción flota automáticamente</strong> en pantalla para presentar la oferta. Cuenta con un <strong>botón de eliminar / cerrar en la esquina superior</strong> que permite descartarla en un clic, manteniendo además una pestaña flotante accesible para reabrirla.
            </p>

            {/* Simulación visual de la tarjeta flotante */}
            <div className="relative max-w-sm mx-auto p-4 rounded-2xl bg-white border border-pink-200 shadow-md space-y-2 text-left">
              <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-stone-100 text-stone-400 border border-stone-200" title="Botón de eliminar en la esquina">
                <X className="w-3.5 h-3.5" />
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-400 text-stone-900 text-[9px] font-black uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{formData.promocionBadge || 'OFERTA ESPECIAL'}</span>
              </div>
              <h4 className="text-xs font-serif font-bold text-stone-900 pr-5 leading-tight">
                {formData.promocionTitulo || '¡Endulza tus Eventos y Fiestas!'}
              </h4>
              {formData.promocionDescuento && (
                <span className="inline-block text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
                  {formData.promocionDescuento}
                </span>
              )}
              <p className="text-[11px] text-stone-500 line-clamp-2">
                {formData.promocionTexto || 'Cotiza mesas de postres, cupcakes y pasteles personalizados con atención directa.'}
              </p>

              {/* Vista previa de productos seleccionados en la tarjeta */}
              {selectedPromoIds.length > 0 && (
                <div className="pt-1.5 border-t border-stone-100">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Postres incluidos en la promoción ({selectedPromoIds.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedPromoIds.slice(0, 3).map((id) => {
                      const p = productos.find((item) => item.id === id);
                      if (!p) return null;
                      return (
                        <span
                          key={id}
                          className="text-[10px] font-medium bg-pink-50 text-pink-800 px-2 py-0.5 rounded-md border border-pink-200 truncate max-w-[120px]"
                        >
                          {p.nombre}
                        </span>
                      );
                    })}
                    {selectedPromoIds.length > 3 && (
                      <span className="text-[10px] font-bold text-stone-400 px-1 py-0.5">
                        +{selectedPromoIds.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-1">
                <span className="block w-full py-1.5 px-3 rounded-lg bg-[#25D366] text-white text-[11px] font-bold text-center">
                  {formData.promocionBotonTexto || 'Aprovechar Oferta por WhatsApp'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Galería e Imágenes de la Web (Hero, Logo y Fotos debajo del menú) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-800" />
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Imágenes de la Web y Galería
                </h3>
                <p className="text-xs text-stone-500">
                  Sube fotos directamente desde los archivos de tu equipo o ingresa un enlace web.
                </p>
              </div>
            </div>
          </div>

          {/* Logo & Portada Principal (Hero) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/70">
              <ImageUploadInput
                label="Logo del Negocio (Barra Superior y Tickets)"
                value={formData.logoUrl || ''}
                onChange={(val) => setFormData({ ...formData, logoUrl: val })}
                helperText="Aparece en la barra de navegación, el pie de página y comprobantes."
                previewHeight="h-28"
              />
            </div>

            <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/70">
              <ImageUploadInput
                label="Foto de Portada Principal (Hero)"
                value={formData.heroImagen || ''}
                onChange={(val) => setFormData({ ...formData, heroImagen: val })}
                helperText="La imagen grande que da la bienvenida a tus clientes al entrar a la web."
                previewHeight="h-28"
              />
            </div>
          </div>

          {/* Fotos debajo del Menú (Sección Nosotros / Tradición) */}
          <div className="pt-3 border-t border-stone-100">
            <div className="mb-3">
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <span>Fotos debajo del Menú (Galería / Sección Nosotros)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  4 Fotografías
                </span>
              </h4>
              <p className="text-xs text-stone-500">
                Estas 4 fotos se exhiben en la sección "Nuestra Historia & Pasión" justo debajo del menú digital.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                <ImageUploadInput
                  label="Foto 1 (Cheesecake / Especialidad)"
                  value={
                    formData.historiaImagen1 !== undefined
                      ? formData.historiaImagen1
                      : 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80'
                  }
                  onChange={(val) => setFormData({ ...formData, historiaImagen1: val })}
                  previewHeight="h-32"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                <ImageUploadInput
                  label="Foto 2 (Alfajores / Dulces)"
                  value={
                    formData.historiaImagen2 !== undefined
                      ? formData.historiaImagen2
                      : 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=80'
                  }
                  onChange={(val) => setFormData({ ...formData, historiaImagen2: val })}
                  previewHeight="h-32"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                <ImageUploadInput
                  label="Foto 3 (Dulcería / Postres)"
                  value={
                    formData.historiaImagen3 !== undefined
                      ? formData.historiaImagen3
                      : 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=500&q=80'
                  }
                  onChange={(val) => setFormData({ ...formData, historiaImagen3: val })}
                  previewHeight="h-32"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                <ImageUploadInput
                  label="Foto 4 (Tortas / Cacao)"
                  value={
                    formData.historiaImagen4 !== undefined
                      ? formData.historiaImagen4
                      : 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80'
                  }
                  onChange={(val) => setFormData({ ...formData, historiaImagen4: val })}
                  previewHeight="h-32"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contacto y WhatsApp */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Phone className="w-5 h-5 text-amber-800" />
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Contacto y Canales de Atención
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Teléfono Directo
              </label>
              <input
                type="text"
                value={formData.telefono || ''}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                WhatsApp de Pedidos *
              </label>
              <input
                type="text"
                required
                value={formData.whatsapp || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Instagram (@dulzurasdebelgis)
              </label>
              <input
                type="url"
                value={formData.instagram || ''}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                TikTok (@dulzurasdebelgis)
              </label>
              <input
                type="url"
                placeholder="https://tiktok.com/@dulzurasdebelgis"
                value={formData.tiktok || ''}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Facebook (Dulzuras de Belgi's)
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/dulzurasdebelgis"
                value={formData.facebook || ''}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Dirección Física
              </label>
              <input
                type="text"
                value={formData.direccion || ''}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Enlace Google Maps
              </label>
              <input
                type="url"
                value={formData.googleMaps || ''}
                onChange={(e) => setFormData({ ...formData, googleMaps: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Políticas de Administrador y Terminal Cajero */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <ShieldCheck className="w-5 h-5 text-pink-600" />
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Políticas de Seguridad y Terminal Cajero
              </h3>
              <p className="text-xs text-stone-500">
                Restricciones operativas para el rol de administrador y configuración de turnos de caja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Registrar y Gestionar Productos: Permitido para Administrador
                </span>
                <span className="text-[11px] text-emerald-800 block leading-relaxed mt-0.5">
                  El rol Administrador tiene autorización plena para dar de alta postres, pasteles, crear categorías, ajustar precios y modificar stock desde la sección "Productos" e "Inventario".
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
              <ShieldCheck className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-950 block">
                  Realizar Ventas y Cobros: Exclusivo para Cajero
                </span>
                <span className="text-[11px] text-amber-800 block leading-relaxed mt-0.5">
                  Por política comercial del negocio, el Administrador <strong>no puede realizar ventas ni emitir cobros</strong>. Para facturar clientes en el POS, debe iniciarse sesión con una cuenta de <strong>Cajero</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Apartado de Cajeros (Agregar y eliminar nombre de cajeros) */}
        <CajerosManager
          cajeros={formData.cajerosPredefinidos || []}
          onSaveCajeros={async (nuevaLista) => {
            const updated = { ...formData, cajerosPredefinidos: nuevaLista };
            setFormData(updated);
            await configuracionService.updateConfiguracion({ cajerosPredefinidos: nuevaLista });
            if (onRefreshData) onRefreshData();
          }}
        />

        {/* Horarios de Atención */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Clock className="w-5 h-5 text-amber-800" />
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Horarios de Apertura y Cierre
            </h3>
          </div>

          <div className="space-y-2">
            {DIAS_KEYS.map(({ key, label }) => {
              const diaConfig = formData.horarios?.[key] || { activo: true, apertura: '09:00', cierre: '19:30' };
              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 gap-3"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer sm:w-36">
                    <input
                      type="checkbox"
                      checked={diaConfig.activo}
                      onChange={(e) => handleHorarioChange(key, 'activo', e.target.checked)}
                      className="rounded text-amber-900 focus:ring-amber-900"
                    />
                    <span className="text-xs font-bold text-stone-800">{label}</span>
                  </label>

                  {diaConfig.activo ? (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500">Apertura:</span>
                        <input
                          type="time"
                          value={diaConfig.apertura}
                          onChange={(e) => handleHorarioChange(key, 'apertura', e.target.value)}
                          className="px-2 py-1 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500">Cierre:</span>
                        <input
                          type="time"
                          value={diaConfig.cierre}
                          onChange={(e) => handleHorarioChange(key, 'cierre', e.target.value)}
                          className="px-2 py-1 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400 italic">Cerrado todo el día</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modalidades de Entrega y Opciones */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Sparkles className="w-5 h-5 text-amber-800" />
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Modalidades y Opciones de Servicio
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.paraLlevar !== false}
                onChange={(e) => setFormData({ ...formData, paraLlevar: e.target.checked })}
                className="rounded text-amber-900 focus:ring-amber-900"
              />
              <div>
                <span className="text-xs font-bold text-stone-800 block">Pedidos Para Llevar</span>
                <span className="text-[11px] text-stone-500 block">Permitir retiro en tienda en PH Bahía Limón</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.aDomicilio !== false}
                onChange={(e) => setFormData({ ...formData, aDomicilio: e.target.checked })}
                className="rounded text-amber-900 focus:ring-amber-900"
              />
              <div>
                <span className="text-xs font-bold text-stone-800 block">Entrega a Domicilio (Delivery)</span>
                <span className="text-[11px] text-stone-500 block">Permitir solicitar pedidos con dirección en Colón</span>
              </div>
            </label>
          </div>
        </div>

        {/* Datos y Mantenimiento */}
        <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-stone-600" />
            <div>
              <span className="text-xs font-bold text-stone-800 block">
                Almacenamiento y Restauración
              </span>
              <span className="text-[11px] text-stone-500 block">
                {firebaseReady
                  ? 'Base de datos activa en Firebase Firestore.'
                  : 'Modo local activo con persistencia en el navegador.'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:text-rose-700 hover:border-rose-300 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos Demo</span>
          </button>
        </div>

      </form>
    </div>
  );
};
