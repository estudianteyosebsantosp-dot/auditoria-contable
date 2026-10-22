import React, { useState } from 'react';
import {
  BarChart3,
  Upload,
  ClipboardList,
  Sparkles,
  FileDown,
  History,
  Settings,
  Menu,
  X,
  ShieldCheck,
  Cpu,
  PlusCircle,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNewAudit: () => void;
  aiConnected: boolean;
  activeFileName?: string;
  isDemo?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onNewAudit,
  aiConnected,
  activeFileName,
  isDemo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'upload', label: 'Cargar Archivo', icon: Upload },
    { id: 'results', label: 'Hallazgos', icon: ClipboardList },
    { id: 'ai', label: 'Auditor IA', icon: Sparkles },
    { id: 'reports', label: 'Informes', icon: FileDown },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5 cursor-pointer py-1.5" onClick={() => onSelectTab('dashboard')}>
            <div className="relative flex items-center justify-center h-14 sm:h-16 px-3 py-1 rounded-2xl bg-white shadow-xl shadow-blue-600/15 border border-white/40 hover:scale-[1.02] transition-transform shrink-0">
              <img
                src="/assets/aistudio/Captura_de_pantalla_2026-10-21_logooooooooooo_56d6bd4a.png"
                alt="AUDITA WEB Logo"
                className="h-11 sm:h-13 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                  AUDITA WEB
                </span>
                {isDemo && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md">
                    Modo Demo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-300/80 font-medium tracking-normal hidden sm:block">
                Tu aliado en una auditoría contable más inteligente
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                  {item.id === 'ai' && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Utilities: AI Engine Status & New Audit Button */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                aiConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={
                aiConnected
                  ? 'Motor IA Gemini conectado vía Backend'
                  : 'Motor de Auditoría Matemático Local activo'
              }
            >
              {aiConnected ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="font-medium">IA Activa</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium">Motor Local</span>
                </>
              )}
            </div>

            <button
              onClick={onNewAudit}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Auditoría</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onNewAudit}
              className="p-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 px-4 pt-3 pb-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Estado IA: {aiConnected ? 'Conectado' : 'Motor Local'}</span>
            {activeFileName && <span className="truncate max-w-[150px]">{activeFileName}</span>}
          </div>
        </div>
      )}
    </header>
  );
};
