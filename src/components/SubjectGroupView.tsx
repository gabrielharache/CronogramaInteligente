import React, { useState, useMemo } from 'react';
import { PontoEstudo } from '../types';
import { StudyPointCard } from './StudyPointCard';
import { ChevronDown, ChevronUp, BookOpen, Target, Award, Plus, GripVertical } from 'lucide-react';

interface SubjectGroupViewProps {
  pontos: PontoEstudo[];
  materiasCores: Record<string, string>;
  onUpdatePonto: (id: string, updated: Partial<PontoEstudo>) => void;
  onDeletePonto: (id: string) => void;
  onEditPonto: (ponto: PontoEstudo) => void;
  onDuplicatePonto: (ponto: PontoEstudo) => void;
  onSplitPonto?: (ponto: PontoEstudo) => void;
  onNovoPontoNaMateria: (materia: string) => void;
  onMovePonto?: (id: string, direction: 'up' | 'down') => void;
  onStartFocus?: (ponto: PontoEstudo) => void;
  materiaOrder?: string[];
  onUpdateMateriaOrder?: (newOrder: string[]) => void;
  onReorderPontos?: (materia: string, cronogramaId: string | undefined, orderedIds: string[]) => void;
}

export const SubjectGroupView: React.FC<SubjectGroupViewProps> = ({
  pontos,
  materiasCores,
  onUpdatePonto,
  onDeletePonto,
  onEditPonto,
  onDuplicatePonto,
  onSplitPonto,
  onNovoPontoNaMateria,
  onMovePonto,
  onStartFocus,
  materiaOrder,
  onUpdateMateriaOrder,
  onReorderPontos
}) => {
  // Group points by subject
  const grouped: Record<string, PontoEstudo[]> = {};
  (pontos || []).forEach(p => {
    if (!grouped[p.materia]) grouped[p.materia] = [];
    grouped[p.materia].push(p);
  });

  const subjectNames = useMemo(() => {
    const rawNames = Object.keys(grouped);
    if (materiaOrder && materiaOrder.length > 0) {
      const orderMap = new Map<string, number>(materiaOrder.map((m, idx) => [m, idx]));
      return [...rawNames].sort((a, b) => {
        const idxA = orderMap.has(a) ? orderMap.get(a)! : 9999;
        const idxB = orderMap.has(b) ? orderMap.get(b)! : 9999;
        if (idxA !== idxB) return idxA - idxB;
        return a.localeCompare(b, 'pt');
      });
    }
    return [...rawNames].sort((a, b) => a.localeCompare(b, 'pt'));
  }, [grouped, materiaOrder]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Drag and drop states
  const [draggedSubject, setDraggedSubject] = useState<string | null>(null);
  const [dragEnabledSubject, setDragEnabledSubject] = useState<string | null>(null);

  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [dragEnabledTopic, setDragEnabledTopic] = useState<string | null>(null);

  const toggleSubject = (materia: string) => {
    setCollapsed(prev => ({ ...prev, [materia]: !prev[materia] }));
  };

  // Subject drag-and-drop handlers
  const handleSubjectDragStart = (e: React.DragEvent, materia: string) => {
    setDraggedSubject(materia);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSubjectDragOver = (e: React.DragEvent, targetMateria: string) => {
    e.preventDefault();
    if (!draggedSubject || draggedSubject === targetMateria) return;

    const currentIndex = subjectNames.indexOf(draggedSubject);
    const targetIndex = subjectNames.indexOf(targetMateria);
    if (currentIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...subjectNames];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, draggedSubject);
      onUpdateMateriaOrder?.(newOrder);
    }
  };

  const handleSubjectDragEnd = () => {
    setDraggedSubject(null);
    setDragEnabledSubject(null);
  };

  // Topic drag-and-drop handlers
  const handleTopicDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTopicId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTopicDragOver = (e: React.DragEvent, targetId: string, targetMateria: string, siblingItems: PontoEstudo[]) => {
    e.preventDefault();
    if (!draggedTopicId) return;

    const draggedPonto = pontos.find(p => p.id === draggedTopicId);
    if (!draggedPonto || draggedPonto.materia !== targetMateria) return;

    const currentIndex = siblingItems.findIndex(p => p.id === draggedTopicId);
    const targetIndex = siblingItems.findIndex(p => p.id === targetId);

    if (currentIndex !== -1 && targetIndex !== -1 && currentIndex !== targetIndex) {
      const nextItems = [...siblingItems];
      const [removed] = nextItems.splice(currentIndex, 1);
      nextItems.splice(targetIndex, 0, removed);
      
      const orderedIds = nextItems.map(p => p.id);
      onReorderPontos?.(targetMateria, draggedPonto.cronogramaId, orderedIds);
    }
  };

  const handleTopicDragEnd = () => {
    setDraggedTopicId(null);
    setDragEnabledTopic(null);
  };

  if (subjectNames.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center my-6 shadow-2xs">
        <p className="text-sm text-zinc-500">Nenhum ponto de estudo encontrado para agrupar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subjectNames.map(materia => {
        // Maintain strict logical order of topics within each subject,
        // regardless of whether they have dates, are completed, or have been reorganized
        const rawItems = grouped[materia] || [];
        const items = [...rawItems].sort((a, b) => {
          const oA = typeof a.ordem === 'number' ? a.ordem : 999999;
          const oB = typeof b.ordem === 'number' ? b.ordem : 999999;
          if (oA !== oB) return oA - oB;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });
        const color = materiasCores[materia] || '#3F3F46';
        const isCollapsed = Boolean(collapsed[materia]);

        const total = items.length;
        const lidos = items.filter(i => i.lido).length;
        const pctLeitura = total > 0 ? Math.round((lidos / total) * 100) : 0;

        let qTotal = 0;
        let qAcertos = 0;
        items.forEach(i => {
          const t = typeof i.qTotal === 'number' ? i.qTotal : parseInt(String(i.qTotal), 10);
          const a = typeof i.qAcertos === 'number' ? i.qAcertos : parseInt(String(i.qAcertos), 10);
          if (t && !isNaN(t) && t > 0) {
            qTotal += t;
            qAcertos += !isNaN(a) ? Math.min(a, t) : 0;
          }
        });

        const pctAcertos = qTotal > 0 ? Math.round((qAcertos / qTotal) * 100) : null;

        return (
          <div 
            key={materia}
            draggable={dragEnabledSubject === materia}
            onDragStart={(e) => handleSubjectDragStart(e, materia)}
            onDragOver={(e) => handleSubjectDragOver(e, materia)}
            onDragEnd={handleSubjectDragEnd}
            className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-all duration-100 ${
              draggedSubject === materia ? 'opacity-40 border-dashed border-zinc-400 bg-zinc-50/50' : 'border-zinc-200'
            }`}
          >
            {/* Subject Accordion Header */}
            <div 
              className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-white hover:bg-zinc-50 border-b border-zinc-100 transition-colors"
              onClick={() => toggleSubject(materia)}
            >
              <div className="flex items-center gap-2">
                {/* Drag Handle for Subject */}
                <div
                  className="p-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors shrink-0"
                  onMouseEnter={() => setDragEnabledSubject(materia)}
                  onMouseLeave={() => setDragEnabledSubject(null)}
                  onClick={(e) => e.stopPropagation()} // Prevent accordion toggle
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <h3 className="font-sans font-semibold text-base sm:text-lg text-zinc-900 flex items-center gap-1.5">
                    {materia}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {total} {total === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-3 sm:gap-5 text-xs text-zinc-600">
                {/* Leitura stat */}
                <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200/70">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Leitura:</span>
                  <span className="font-mono font-semibold text-zinc-900">{lidos}/{total} ({pctLeitura}%)</span>
                </div>

                {/* Questões stat */}
                <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200/70">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Questões:</span>
                  <span className="font-mono font-semibold text-zinc-900">{qTotal}</span>
                </div>

                {/* Aproveitamento stat */}
                <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200/70">
                  <Award className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Acertos:</span>
                  <span className={`font-mono font-bold ${
                    pctAcertos === null ? 'text-zinc-400' :
                    pctAcertos >= 70 ? 'text-emerald-700' :
                    pctAcertos >= 46 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {pctAcertos !== null ? `${pctAcertos}%` : '—'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNovoPontoNaMateria(materia);
                    }}
                    className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                    title={`Adicionar novo tópico em ${materia}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    className="p-1 text-zinc-400 rounded-md"
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Subject Points Cards */}
            {!isCollapsed && (
              <div className="p-3.5 sm:p-4 bg-zinc-50/50 space-y-2.5">
                {items.map((ponto, idx) => (
                  <StudyPointCard
                    key={ponto.id}
                    ponto={ponto}
                    materiaCor={color}
                    onUpdate={(updated) => onUpdatePonto(ponto.id, updated)}
                    onDelete={() => onDeletePonto(ponto.id)}
                    onEdit={() => onEditPonto(ponto)}
                    onDuplicate={() => onDuplicatePonto(ponto)}
                    onSplit={onSplitPonto ? () => onSplitPonto(ponto) : undefined}
                    onMoveUp={idx > 0 ? () => onMovePonto?.(ponto.id, 'up') : undefined}
                    onMoveDown={idx < items.length - 1 ? () => onMovePonto?.(ponto.id, 'down') : undefined}
                    onStartFocus={onStartFocus ? () => onStartFocus(ponto) : undefined}
                    draggable={dragEnabledTopic === ponto.id}
                    onDragStart={(e) => handleTopicDragStart(e, ponto.id)}
                    onDragOver={(e) => handleTopicDragOver(e, ponto.id, materia, items)}
                    onDragEnd={handleTopicDragEnd}
                    dragHandleProps={{
                      onMouseEnter: () => setDragEnabledTopic(ponto.id),
                      onMouseLeave: () => setDragEnabledTopic(null)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
