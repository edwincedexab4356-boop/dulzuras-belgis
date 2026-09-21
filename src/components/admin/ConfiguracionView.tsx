import React, { useState } from 'react';
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
} from 'lucide-react';
import { ConfiguracionNegocio, HorariosSemana } from '../../types';
import { configuracionService } from '../../services/configuracionService';
import { isFirebaseConfigured } from '../../services/firebase';
import { seedInitialData } from '../../services/initialData';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface ConfiguracionViewProps {
  config: ConfiguracionNegocio;
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
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const firebaseReady = isFirebaseConfigured();

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
                placeholder="Ver Ofertas Especiales"
                value={formData.promocionBotonTexto || ''}
                onChange={(e) => setFormData({ ...formData, promocionBotonTexto: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
              />
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
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.permitirAdminRegistrarProductos !== false}
                onChange={(e) =>
                  setFormData({ ...formData, permitirAdminRegistrarProductos: e.target.checked })
                }
                className="mt-0.5 rounded text-pink-600 focus:ring-pink-500"
              />
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Permitir a Administradores Registrar Productos
                </span>
                <span className="text-[11px] text-stone-500 block leading-relaxed mt-0.5">
                  Permite al administrador agregar nuevos postres, pasteles y creaciones al catálogo mediante el botón "Nuevo Producto".
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.permitirAdminCompras)}
                onChange={(e) =>
                  setFormData({ ...formData, permitirAdminCompras: e.target.checked })
                }
                className="mt-0.5 rounded text-pink-600 focus:ring-pink-500"
              />
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Permitir a Administradores Realizar Compras
                </span>
                <span className="text-[11px] text-stone-500 block leading-relaxed mt-0.5">
                  Por defecto <strong>desactivado</strong>: La pantalla de admin no realiza compras ni emite pedidos de clientes.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 border-t border-stone-100">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Personal de Caja Predefinido (Separados por coma)
            </label>
            <input
              type="text"
              placeholder="Belgis Gómez, Edwin Cedeño, María Delgado, Carlos Pimentel"
              value={formData.cajerosPredefinidos?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cajerosPredefinidos: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Estos nombres aparecen en el selector de inicio de sesión de la terminal de cajero y en la pantalla de caja.
            </p>
          </div>
        </div>

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
