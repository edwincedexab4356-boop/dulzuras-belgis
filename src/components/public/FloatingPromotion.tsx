import React, { useState, useEffect } from 'react';
import { Sparkles, Tag, X, MessageCircle, ArrowRight, Gift, Percent, Plus } from 'lucide-react';
import { ConfiguracionNegocio, Producto } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface FloatingPromotionProps {
  config: ConfiguracionNegocio;
  productos?: Producto[];
  onAddToCart?: (producto: Producto) => void;
  onExploreMenu?: () => void;
}

export const FloatingPromotion: React.FC<FloatingPromotionProps> = ({
  config,
  productos = [],
  onAddToCart,
  onExploreMenu,
}) => {
  // Estado para la ventana flotante que aparece apenas entra a la página
  const [isOpen, setIsOpen] = useState(false);
  // Estado para la pestaña flotante visible en pantalla
  const [isTabVisible, setIsTabVisible] = useState(true);

  const promoActiva = config.promocionActiva !== false;
  const promoTitulo = config.promocionTitulo || '¡Endulza tus Eventos y Fiestas!';
  const promoTexto =
    config.promocionTexto ||
    'Cotiza mesas de postres, cupcakes y pasteles personalizados con atención directa y personalizada.';
  const promoBadge = config.promocionBadge || 'Oferta Especial';
  const promoBotonTexto = config.promocionBotonTexto || 'Aprovechar Oferta por WhatsApp';
  const promoDescuento = config.promocionDescuento || '';
  const promoImagen = config.promocionImagenUrl || '';

  const promoProducts = (productos || []).filter(
    (p) => p.id && config.promocionProductosIds?.includes(p.id)
  );

  // Efecto: Apenas entra a la página, te aparece la pestaña/modal de promociones flotante
  useEffect(() => {
    if (!promoActiva) return;

    // Comprobamos si el usuario ya eliminó o descartó la promoción en esta sesión
    const yaDescartado = sessionStorage.getItem('delicias_promo_cerrada_popup');
    if (!yaDescartado) {
      // Breve retraso suave de 600ms para que la página cargue primero y luego flote el aviso
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [promoActiva]);

  // Si la promoción está desactivada desde el admin, no renderizamos nada
  if (!promoActiva) return null;

  // Enlace directo a WhatsApp con el mensaje personalizado de la promoción
  const cleanPhone = (config.whatsapp || '50767979141').replace(/[^0-9]/g, '');
  const promoWaText = encodeURIComponent(
    `¡Hola ${config.nombre || "Dulzuras de Belgi's"}! Vi su promoción activa: "${promoTitulo}". Me gustaría cotizar y obtener más información.`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${promoWaText}`;

  // Manejador para el botón de eliminar en la esquina
  const handleEliminarPromo = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('delicias_promo_cerrada_popup', 'true');
    } catch (_) {}
  };

  // Manejador para cerrar permanentemente la pestaña flotante
  const handleOcultarTabFlotante = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTabVisible(false);
  };

  const handleIrAlMenu = () => {
    setIsOpen(false);
    if (onExploreMenu) {
      onExploreMenu();
    } else {
      const el = document.getElementById('menu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 1. MODAL / TARJETA FLOTANTE DE PROMOCIONES (Aparece apenas entra a la página) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-300"
        >
          {/* Fondo para cerrar al hacer clic afuera */}
          <div className="absolute inset-0" onClick={handleEliminarPromo} />

          {/* Tarjeta flotante con sombra y bordes redondeados adaptada a pantallas chicas y grandes */}
          <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* BOTÓN DE ELIMINAR / CERRAR EN LA ESQUINA */}
            <button
              id="btn-eliminar-promocion-esquina"
              onClick={handleEliminarPromo}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 rounded-full bg-white/95 hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-colors shadow-md border border-stone-200 hover:border-rose-200 cursor-pointer group"
              title="Eliminar / Cerrar aviso de promoción"
              aria-label="Eliminar promoción"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Contenedor scrolleable suave para teléfonos de pantalla baja (iPhone SE, Galaxy A, etc.) */}
            <div className="overflow-y-auto overscroll-contain flex-1">
              {/* Cabecera visual con fondo degradado y confeti suave */}
              <div className="relative p-5 sm:p-6 pt-6 sm:pt-7 bg-gradient-to-br from-pink-600 via-pink-700 to-rose-700 text-white overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-lime-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative pr-8 space-y-1.5 sm:space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400 text-stone-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                    <span>{promoBadge}</span>
                  </div>

                  <h3
                    id="promo-titulo"
                    className="font-serif text-lg sm:text-2xl font-extrabold text-white leading-tight"
                  >
                    {promoTitulo}
                  </h3>

                  {promoDescuento && (
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-xs text-lime-300 text-xs font-black uppercase tracking-wide">
                      {promoDescuento}
                    </div>
                  )}
                </div>
              </div>

              {/* Imagen opcional de la promoción */}
              {promoImagen && (
                <div className="relative h-36 sm:h-44 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={promoImagen}
                    alt={promoTitulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Cuerpo del anuncio flotante */}
              <div className="p-4 sm:p-6 space-y-4 bg-[#fffdfa]">
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {promoTexto}
                </p>

                {/* Lista de postres incluidos en la promoción */}
                {promoProducts.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-pink-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif font-bold text-stone-900 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-pink-600" />
                        <span>Postres en Promoción:</span>
                      </span>
                      <span className="text-[11px] text-pink-700 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                        {promoProducts.length} {promoProducts.length === 1 ? 'postre' : 'postres'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-36 sm:max-h-40 overflow-y-auto pr-1">
                      {promoProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-pink-50/70 border border-pink-200/90 hover:bg-pink-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-pink-200">
                              <img
                                src={
                                  p.imagen ||
                                  'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=200&q=80'
                                }
                                alt={p.nombre}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-serif text-xs font-bold text-stone-900 truncate">
                                {p.nombre}
                              </h5>
                              <span className="text-[11px] text-pink-700 font-bold block">
                                {formatCurrency(p.precio)}
                              </span>
                            </div>
                          </div>

                          {onAddToCart && (
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(p);
                                handleEliminarPromo();
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 active:scale-95 text-white text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                              title={`Agregar ${p.nombre} al pedido`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Pedir</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 shadow-xs">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-amber-950">
                    <span className="font-bold block">Atención directa e inmediata</span>
                    <span className="text-[11px] text-amber-800/90 block">
                      Cotizaciones personalizadas para cumpleaños, bodas y eventos especiales.
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="space-y-2.5 pt-1">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleEliminarPromo}
                    className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                    <span>{promoBotonTexto}</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleIrAlMenu}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Explorar menú de postres</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>

                <div className="text-center pt-1 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400 tracking-wide font-medium">
                    {config.nombre || "Dulzuras de Belgi's"} • Promoción sujeta a disponibilidad
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PESTAÑA FLOTANTE DE PROMOCIONES (Permanece flotando en pantalla para reabrir) */}
      {isTabVisible && (
        <aside
          aria-label="Pestaña flotante de promociones"
          className="fixed bottom-20 sm:bottom-6 left-4 z-40 animate-in slide-in-from-left duration-300"
        >
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-stone-900/90 hover:bg-stone-900 text-white backdrop-blur-md shadow-xl border border-pink-500/40 hover:border-pink-400 transition-all group">
            {/* Botón principal de la pestaña flotante */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 text-left cursor-pointer"
              title="Ver promociones y ofertas especiales"
            >
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-400" />
                </span>
              </span>
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-black tracking-wider text-lime-400 block">
                  {promoBadge}
                </span>
                <span className="text-xs font-bold text-white group-hover:text-pink-200 transition-colors block">
                  Ver Promoción
                </span>
              </div>
            </button>

            {/* Pequeño botón de eliminar la pestaña si el usuario desea ocultarla */}
            <button
              type="button"
              onClick={handleOcultarTabFlotante}
              className="p-1 rounded-full text-stone-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer mr-1"
              title="Ocultar pestaña flotante"
              aria-label="Ocultar pestaña flotante"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
