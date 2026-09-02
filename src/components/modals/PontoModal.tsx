import React, { useState, useEffect } from 'react';
import { PontoEstudo, Cronograma, TipoEstudo } from '../../types';
import { COLOR_PALETTE } from '../../data/seed';
import { getDiaDaSemana } from '../../utils/helpers';
import { X, BookOpen, AlertCircle, Scale, Landmark, Layers } from 'lucide-react';

interface PontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ponto: PontoEstudo | null;
  materias: string[];
  materiasCores: Record<string, string>;
  cronogramas: Cronograma[];
  activeCronogramaId: string;
  onSave: (pontoData: {
    id?: string;
    cronogramaId?: string;
    titulo: string;
    materia: string;
    tipoEstudo: TipoEstudo;
    artigosLei?: string;
    jurisprudenciaRef?: string;
    novaMateriaCor?: string;
    data: string;
    notas: string;
  }) => void;
  initialDate?: string;
  initialMateria?: string;
}

export const PontoModal: React.FC<PontoModalProps> = ({
  isOpen,
  onClose,
  ponto,
  materias,
  materiasCores,
  cronogramas,
  activeCronogramaId,
  onSave,
  initialDate,
  initialMateria
}) => {
  const [titulo, setTitulo] = useState('');
  const [materia, setMateria] = useState('');
  const [tipoEstudo, setTipoEstudo] = useState<TipoEstudo>('doutrina');
  const [cronogramaId, setCronogramaId] = useState<string>('');
  const [artigosLei, setArtigosLei] = useState('');
  const [jurisprudenciaRef, setJurisprudenciaRef] = useState('');
  const [isNovaMateria, setIsNovaMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState(COLOR_PALETTE[0]);
  const [data, setData] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (ponto) {
      setTitulo(ponto.titulo);
      setMateria(ponto.materia);
      setTipoEstudo(ponto.tipoEstudo || 'doutrina');
      setCronogramaId(ponto.cronogramaId || activeCronogramaId || 'cronograma-geral');
      setArtigosLei(ponto.artigosLei || '');
      setJurisprudenciaRef(ponto.jurisprudenciaRef || '');
      setIsNovaMateria(false);
      setData(ponto.data || '');
      setNotas(ponto.notas || '');
    } else {
      setTitulo('');
      const defaultMat = initialMateria || (materias.length > 0 ? materias[0] : 'Administrativo');
      setMateria(defaultMat);
      setTipoEstudo('doutrina');
      setCronogramaId(activeCronogramaId !== 'all' ? activeCronogramaId : (cronogramas[0]?.id || 'cronograma-geral'));
      setArtigosLei('');
      setJurisprudenciaRef('');
      setIsNovaMateria(false);
      setNovaMateriaNome('');
      setNovaMateriaCor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
      setData(initialDate || new Date().toISOString().slice(0, 10));
      setNotas('');
    }
    setError('');
  }, [ponto, isOpen, initialDate, initialMateria, materias, activeCronogramaId, cronogramas]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('Por favor, informe o título do ponto de estudo.');
      return;
    }

    let finalMateria = materia;
    if (isNovaMateria) {
      if (!novaMateriaNome.trim()) {
        setError('Por favor, informe o nome da nova matéria.');
        return;
      }
      finalMateria = novaMateriaNome.trim();
    }

    onSave({
      id: ponto?.id,
      cronogramaId: cronogramaId || (cronogramas[0]?.id || 'cronograma-geral'),
      titulo: titulo.trim(),
      materia: finalMateria,
      tipoEstudo,
      artigosLei: artigosLei.trim() || undefined,
      jurisprudenciaRef: jurisprudenciaRef.trim() || undefined,
      novaMateriaCor: isNovaMateria ? novaMateriaCor : undefined,
      data,
      notas: notas.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-sans font-semibold text-base text-zinc-900">
              {ponto ? 'Editar ponto de estudo' : 'Novo ponto de estudo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cronograma Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Cronograma / Edital *
            </label>
            <div className="relative">
              <select
                value={cronogramaId}
                onChange={(e) => setCronogramaId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all font-medium cursor-pointer"
              >
                {cronogramas.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Study Type Division Selector (Doutrina, Lei Seca, Jurisprudência) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Tipo de Estudo *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipoEstudo('doutrina')}
                className={`py-2 px-2 rounded-lg border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                  tipoEstudo === 'doutrina'
                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Doutrina</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoEstudo('lei_seca')}
                className={`py-2 px-2 rounded-lg border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                  tipoEstudo === 'lei_seca'
                    ? 'bg-amber-600 text-white border-amber-600 font-semibold shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Lei Seca</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoEstudo('jurisprudencia')}
                className={`py-2 px-2 rounded-lg border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                  tipoEstudo === 'jurisprudencia'
                    ? 'bg-emerald-700 text-white border-emerald-700 font-semibold shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Jurisprudência</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Título do tópico / conteúdo *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Atos Administrativos — Espécies e Revogação"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium"
            />
          </div>

          {/* Conditional field for Lei Seca or Jurisprudencia */}
          {tipoEstudo === 'lei_seca' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-800 mb-1">
                Artigos da Lei / Legislação Aplicável
              </label>
              <input
                type="text"
                value={artigosLei}
                onChange={(e) => setArtigosLei(e.target.value)}
                placeholder="Ex.: Arts. 1º a 30 da Lei 14.133/21 ou CF/88 Art. 5º (I a XXX)"
                className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-amber-600 focus:bg-white font-mono"
              />
            </div>
          )}

          {tipoEstudo === 'jurisprudencia' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-800 mb-1">
                Súmulas, Temas e Informativos
              </label>
              <input
                type="text"
                value={jurisprudenciaRef}
                onChange={(e) => setJurisprudenciaRef(e.target.value)}
                placeholder="Ex.: Súmula Vinculante 3 STF, Tema 1199 STF, Informativo 750 STJ"
                className="w-full px-3 py-2 text-xs bg-emerald-50/50 border border-emerald-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono"
              />
            </div>
          )}

          {/* Subject & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Subject selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Matéria *
              </label>
              <select
                value={isNovaMateria ? '__NOVA__' : materia}
                onChange={(e) => {
                  if (e.target.value === '__NOVA__') {
                    setIsNovaMateria(true);
                  } else {
                    setIsNovaMateria(false);
                    setMateria(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium cursor-pointer"
              >
                {materias.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
                <option value="__NOVA__">➕ Criar nova matéria...</option>
              </select>
            </div>

            {/* Date picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Data planejada
                </label>
                {data && (
                  <span className="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded">
                    {getDiaDaSemana(data).nomeCompleto}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-mono"
              />
            </div>
          </div>

          {/* New Subject Details if selected */}
          {isNovaMateria && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Nome da nova matéria
                </label>
                <input
                  type="text"
                  value={novaMateriaNome}
                  onChange={(e) => setNovaMateriaNome(e.target.value)}
                  placeholder="Ex.: Direito Urbanístico"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-hidden focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Cor de identificação
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNovaMateriaCor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        novaMateriaCor === c ? 'scale-125 ring-2 ring-zinc-900 ring-offset-1' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Anotações, páginas e metas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Ex.: Páginas 45 a 80 da sinopse, resolver 25 questões no TEC Concursos..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-sans leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-2xs transition-colors"
            >
              {ponto ? 'Salvar alterações' : 'Adicionar ponto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
