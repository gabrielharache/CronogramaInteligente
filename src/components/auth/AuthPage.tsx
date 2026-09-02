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
  Zap,
  Info,
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

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#18181B] flex flex-col justify-center px-4 sm:px-6 py-10 selection:bg-[#E4E4E7] selection:text-[#18181B]">
      
      {/* Container principal centralizado */}
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Top Header / Branding */}
        <div className="mb-8 flex items-center justify-between pb-4 border-b border-zinc-200/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl select-none">📚</span>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-zinc-900 tracking-tight text-base sm:text-lg">
                Cronograma Inteligente
              </span>
              <span className="text-xs text-zinc-400 hidden sm:inline-block">
                — Estante de Estudos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 border border-emerald-200/80 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Modo Local
              </span>
            )}
          </div>
        </div>

        {/* Grid: Coluna de Apresentação + Card de Formulário */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Coluna Esquerda: Apresentação com estética Notion/Editorial */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-200/60 text-zinc-700 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
              <span>Preparação de alto rendimento</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-serif text-zinc-900 leading-snug tracking-tight">
                Sua rotina de estudos com <span className="italic underline decoration-zinc-300 underline-offset-4">ordem e clareza</span>.
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Planejamento diário, controle de leitura, artigos de lei seca e aproveitamento de questões centralizados em um ambiente calmo e livre de distrações.
              </p>
            </div>

            {/* Destaques visuais minimalistas */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-zinc-900">Sincronização Segura na Nuvem</h2>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Seus dados protegidos pelo Supabase, isolados na sua conta e acessíveis de qualquer dispositivo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 mt-0.5">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-zinc-900">Visão Semanal & Calendário</h2>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Distribuição equilibrada de doutrina, lei seca e jurisprudência com métricas de assertividade.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-zinc-900">Multi-Cronogramas & Editais</h2>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Crie planos simultâneos para diferentes concursos sem misturar seu progresso.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Cartão de Autenticação */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
              
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
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          mode === 'login'
                            ? 'bg-white text-zinc-900 shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Entrar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          mode === 'signup'
                            ? 'bg-white text-zinc-900 shadow-2xs'
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
                          className="text-[11px] text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
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
                  className="w-full mt-3 py-2.5 px-4 bg-[#18181B] hover:bg-zinc-800 active:scale-[0.99] text-white font-medium rounded-lg text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
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
                  className="text-xs text-zinc-500 hover:text-zinc-800 underline underline-offset-4 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continuar como visitante (modo offline local)</span>
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Rodapé discreto da página */}
        <div className="mt-12 text-center text-xs text-zinc-400">
          Cronograma Inteligente de Estudos • Seus dados seguros e isolados
        </div>

      </div>
    </div>
  );
};
