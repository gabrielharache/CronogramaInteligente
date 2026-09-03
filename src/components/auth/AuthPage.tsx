import React, { useState } from 'react';
import { 
  BookOpen, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  CalendarClock,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, resetPassword, loginAsGuest, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Informe seu e-mail para recuperar a senha.');
        return;
      }
      setLoading(true);
      const res = await resetPassword(email.trim());
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Enviamos o link de recuperação para seu e-mail.');
      }
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }

      setLoading(true);
      const res = await signUp(email.trim(), password, name.trim());
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.requiresEmailConfirmation) {
        setSuccessMsg('Cadastro criado com sucesso! Verifique sua caixa de entrada para confirmar o e-mail e fazer login.');
        setMode('login');
      }
      return;
    }

    // Login mode
    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const renderAuthCard = (customClasses?: string) => {
    return (
      <div className={`bg-white border border-zinc-200/95 rounded-2xl p-6 sm:p-8 shadow-xs ${customClasses || ''}`}>
        
        {/* Abas e Título do Formulário */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#18181B] flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Área de Acesso</h2>
                <span className="text-[11px] text-zinc-500">
                  {mode === 'login' && 'Entrar na sua conta'}
                  {mode === 'signup' && 'Criar novo cronograma'}
                  {mode === 'forgot' && 'Recuperação de acesso'}
                </span>
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/60 text-xs">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Cadastrar
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500">
            {mode === 'login' && 'Informe suas credenciais para carregar seu cronograma sincronizado.'}
            {mode === 'signup' && 'Crie sua conta gratuita para salvar seus pontos de estudo na nuvem.'}
            {mode === 'forgot' && 'Digite seu e-mail cadastrado para enviarmos as instruções.'}
          </p>
        </div>

        {/* Mensagens de Alerta / Sucesso */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Nome completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maria Fernandes"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Confirme sua senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 px-4 bg-[#18181B] hover:bg-zinc-800 active:scale-[0.99] text-white font-medium rounded-lg text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer font-semibold"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Entrar no Cronograma'}
                  {mode === 'signup' && 'Criar Conta e Iniciar'}
                  {mode === 'forgot' && 'Enviar link de recuperação'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Voltar para a tela de login
            </button>
          </div>
        )}

        {/* Rodapé do formulário: Opção de Modo Visitante */}
        <div className="mt-6 pt-4 border-t border-zinc-200/80 text-center">
          <button
            type="button"
            onClick={loginAsGuest}
            className="text-xs text-zinc-500 hover:text-zinc-800 underline underline-offset-4 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <span>Continuar como visitante (modo offline local)</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-[#f7f7f5] text-[#18181B] flex flex-col justify-center px-4 sm:px-6 py-10 selection:bg-[#E4E4E7] selection:text-[#18181B]"
      style={{ fontFamily: '"Palatino Linotype", "Book Antiqua", "Palatino", "Georgia", serif' }}
    >
      
      {/* Container principal centralizado */}
      <div className="max-w-md mx-auto w-full">
        
        {/* Top Header / Branding - Centered & Minimal */}
        <div className="mb-10 flex flex-col items-center pb-4 border-b border-zinc-200/50">
          <div className="flex items-center">
            <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 font-medium">
              Cronograma Inteligente
            </span>
          </div>
        </div>

        {/* Elegant Header Text above card */}
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-3xl font-serif text-zinc-900 tracking-tight leading-tight">
            Sua rotina com <span className="italic">ordem e clareza</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Planejamento diário, lei seca e controle de questões em um ambiente calmo e livre de distrações.
          </p>
        </div>

        {renderAuthCard()}

        {/* Rodapé discreto da página */}
        <div className="mt-16 text-center text-xs text-zinc-400">
          Cronograma Inteligente - Criado por Gabriel Harache
        </div>

      </div>
    </div>
  );
};
