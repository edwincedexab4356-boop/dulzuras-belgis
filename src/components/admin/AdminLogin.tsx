import React, { useState } from 'react';
import { Lock, Mail, ArrowLeft, AlertCircle, ShieldCheck, UserCheck, KeyRound, Sparkles } from 'lucide-react';
import { authService } from '../../services/authService';
import { isFirebaseConfigured } from '../../services/firebase';
import { UserAuth, ConfiguracionNegocio } from '../../types';
import { BelgisLogo } from '../common/BelgisLogo';

interface AdminLoginProps {
  onLoginSuccess: (user: UserAuth) => void;
  onBackToPublic: () => void;
  config?: ConfiguracionNegocio;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToPublic,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'cajero' | 'admin'>('cajero');

  // Generic cashier credentials
  const defaultCajeroEmail = config?.correoGenericoCajero || 'caja@dulzurasdebelgis.com';
  const [cajeroEmail, setCajeroEmail] = useState(defaultCajeroEmail);
  const [cajeroPassword, setCajeroPassword] = useState('123456');
  
  // Shift staff selection
  const predefinedStaff = config?.cajerosPredefinidos || [
    'Belgis Gómez',
    'Edwin Cedeño',
    'María Delgado',
    'Carlos Pimentel',
  ];
  const [selectedStaff, setSelectedStaff] = useState<string>(predefinedStaff[0] || 'Belgis Gómez');
  const [customStaff, setCustomStaff] = useState<string>('');
  const [isCustomStaff, setIsCustomStaff] = useState<boolean>(false);

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firebaseReady = isFirebaseConfigured();

  const handleCajeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cashierName = isCustomStaff ? customStaff.trim() : selectedStaff.trim();
    if (!cashierName) {
      setError('Por favor indica el nombre de la persona que realiza la jornada.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(cajeroEmail, cajeroPassword, cashierName);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar la jornada de caja.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authService.login(adminEmail, adminPassword);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión como administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f8] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to store button */}
        <button
          onClick={onBackToPublic}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-pink-700 mb-5 ml-4 sm:ml-0 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Público</span>
        </button>

        {/* Brand header */}
        <div className="text-center">
          <BelgisLogo size={88} className="mx-auto mb-2" showDetails={false} />
          <h2 className="font-serif text-3xl font-extrabold text-stone-900 tracking-tight">
            {config?.nombre || "Dulzuras de Belgi's"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-pink-700 font-semibold italic">
            {config?.eslogan || 'Repostería para todos tus eventos!!'}
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 px-6 sm:px-8 rounded-3xl shadow-xl border border-pink-100">
          
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('cajero');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'cajero'
                  ? 'bg-white text-pink-700 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Terminal Cajero</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-pink-700 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Administrador</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CAJERO JORNADA */}
          {activeTab === 'cajero' ? (
            <form onSubmit={handleCajeroSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-pink-50/70 border border-pink-200/80 text-xs text-pink-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                  <span>Jornada de Caja y Facturación</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Ingreso rápido con correo genérico de caja. Selecciona o escribe quién realiza la jornada hoy para asociarlo a los cobros.
                </p>
              </div>

              {/* Staff Member Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ¿Quién realiza la jornada hoy?
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {predefinedStaff.map((staffName) => {
                    const isSelected = !isCustomStaff && selectedStaff === staffName;
                    return (
                      <button
                        key={staffName}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staffName);
                          setIsCustomStaff(false);
                        }}
                        className={`p-2 text-left rounded-xl text-xs font-semibold border transition-all cursor-pointer truncate ${
                          isSelected
                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {staffName}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomStaff(true)}
                    className={`p-2 text-left rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isCustomStaff
                        ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    + Escribir otro nombre
                  </button>
                </div>

                {isCustomStaff && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      placeholder="Escribe el nombre del cajero responsable"
                      value={customStaff}
                      onChange={(e) => setCustomStaff(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-pink-300 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Generic Email */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Correo genérico de caja
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={cajeroEmail}
                    onChange={(e) => setCajeroEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Cashier Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Contraseña de terminal
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={cajeroPassword}
                    onChange={(e) => setCajeroPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-bold text-sm shadow-md shadow-pink-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Iniciar Jornada como {isCustomStaff ? customStaff || 'Cajero' : selectedStaff}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: ADMINISTRADOR */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                Acceso completo para administración, estadísticas, inventarios y configuración general del negocio.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Correo de Administrador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@deliciasbelgi.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Ingresar como Administrador</span>
                )}
              </button>
            </form>
          )}

          {/* Registration footer info */}
          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-400 font-medium">
              {config?.marcaRegistradaTexto || 'Marca debidamente registrada en el Registro Público de Panamá'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
