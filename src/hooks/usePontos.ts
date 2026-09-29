import { useCallback, Dispatch, SetStateAction } from 'react';
import confetti from 'canvas-confetti';
import { AppState, PontoEstudo, TipoEstudo } from '../types';
import { uid, addDays, calcularDificuldadeAutomatica } from '../utils/helpers';

// Study point CRUD, ordering, duplication and splitting
export function usePontos(setState: Dispatch<SetStateAction<AppState>>) {
  const handleUpdatePonto = useCallback((id: string, updated: Partial<PontoEstudo>) => {
    setState(prev => {
      const nextPontos = prev.pontos.map(p => {
        if (p.id === id) {
          const isBecomingFullyDone = (updated.lido ?? p.lido) && (updated.qFeitas ?? p.qFeitas) && !(p.lido && p.qFeitas);
          if (isBecomingFullyDone) {
            try {
              confetti({
                particleCount: 40,
                spread: 55,
                origin: { y: 0.8 },
                colors: ['#18181B', '#059669', '#2563EB', '#D97706']
              });
            } catch (_) {}
          }
          const merged = { ...p, ...updated, updatedAt: Date.now() };
          // Auto update dif if questions are updated
          if (updated.qTotal !== undefined || updated.qAcertos !== undefined) {
            merged.dif = calcularDificuldadeAutomatica(merged);
          }
          return merged;
        }
        return p;
      });
      return { ...prev, pontos: nextPontos };
    });
  }, [setState]);

  const handleDeletePonto = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pontos: prev.pontos.filter(p => p.id !== id)
    }));
  }, [setState]);

  const handleMovePonto = useCallback((id: string, direction: 'up' | 'down') => {
    setState(prev => {
      const targetPonto = prev.pontos.find(p => p.id === id);
      if (!targetPonto) return prev;

      // Find all points of the same materia and cronograma, sorted by logical ordem
      const subjectPoints = prev.pontos
        .filter(p => p.materia === targetPonto.materia && p.cronogramaId === targetPonto.cronogramaId)
        .sort((a, b) => {
          const oA = typeof a.ordem === 'number' ? a.ordem : 999999;
          const oB = typeof b.ordem === 'number' ? b.ordem : 999999;
          if (oA !== oB) return oA - oB;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });

      const position = subjectPoints.findIndex(p => p.id === id);
      if (position === -1) return prev;

      let swapWithPos = -1;
      if (direction === 'up' && position > 0) {
        swapWithPos = position - 1;
      } else if (direction === 'down' && position < subjectPoints.length - 1) {
        swapWithPos = position + 1;
      }

      if (swapWithPos === -1) return prev;

      // Swap their positions
      const reordered = [...subjectPoints];
      const temp = reordered[position];
      reordered[position] = reordered[swapWithPos];
      reordered[swapWithPos] = temp;

      // Reassign clean sequence ordems: 1, 2, 3...
      const ordemMap = new Map<string, number>();
      reordered.forEach((p, index) => {
        ordemMap.set(p.id, index + 1);
      });

      const nextPontos = prev.pontos.map(p => {
        if (ordemMap.has(p.id)) {
          return {
            ...p,
            ordem: ordemMap.get(p.id)!,
            updatedAt: Date.now()
          };
        }
        return p;
      });

      return {
        ...prev,
        pontos: nextPontos
      };
    });
  }, [setState]);

  const handleReorderPontos = useCallback((materia: string, cronogramaId: string | undefined, orderedIds: string[]) => {
    setState(prev => {
      const ordemMap = new Map<string, number>();
      orderedIds.forEach((id, index) => {
        ordemMap.set(id, index + 1);
      });

      const nextPontos = prev.pontos.map(p => {
        if (p.materia === materia && (cronogramaId === undefined || p.cronogramaId === cronogramaId) && ordemMap.has(p.id)) {
          return {
            ...p,
            ordem: ordemMap.get(p.id)!,
            updatedAt: Date.now()
          };
        }
        return p;
      });

      return {
        ...prev,
        pontos: nextPontos
      };
    });
  }, [setState]);

  const handleSavePonto = useCallback((data: {
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
  }) => {
    setState(prev => {
      const updatedColors = { ...prev.materiasCores };
      if (data.novaMateriaCor) {
        updatedColors[data.materia] = data.novaMateriaCor;
      }

      const assignedCronogramaId = data.cronogramaId || 
        (prev.activeCronogramaId !== 'all' ? prev.activeCronogramaId : (prev.cronogramas[0]?.id || 'cronograma-geral'));

      if (data.id) {
        // Edit existing
        const nextPontos = prev.pontos.map(p => {
          if (p.id === data.id) {
            return {
              ...p,
              cronogramaId: assignedCronogramaId,
              titulo: data.titulo,
              materia: data.materia,
              tipoEstudo: data.tipoEstudo,
              artigosLei: data.artigosLei,
              jurisprudenciaRef: data.jurisprudenciaRef,
              data: data.data,
              notas: data.notas,
              updatedAt: Date.now()
            };
          }
          return p;
        });
        return { ...prev, pontos: nextPontos, materiasCores: updatedColors };
      } else {
        // Add new, calculating next sequential logical ordem in this subject
        const targetCronId = assignedCronogramaId;
        const subjectPoints = prev.pontos.filter(p => p.materia === data.materia && p.cronogramaId === targetCronId);
        const maxOrdem = subjectPoints.reduce((max, p) => Math.max(max, typeof p.ordem === 'number' ? p.ordem : 0), 0);

        const newPonto: PontoEstudo = {
          id: uid(),
          cronogramaId: targetCronId,
          titulo: data.titulo,
          materia: data.materia,
          tipoEstudo: data.tipoEstudo,
          artigosLei: data.artigosLei,
          jurisprudenciaRef: data.jurisprudenciaRef,
          data: data.data,
          notas: data.notas,
          lido: false,
          qFeitas: false,
          qTotal: '',
          qAcertos: '',
          dif: null,
          showNotes: Boolean(data.notas),
          ordem: maxOrdem + 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        return {
          ...prev,
          pontos: [...prev.pontos, newPonto],
          materiasCores: updatedColors
        };
      }
    });
  }, [setState]);

  const handleDuplicatePonto = useCallback((ponto: PontoEstudo) => {
    setState(prev => {
      const subjectPoints = prev.pontos.filter(p => p.materia === ponto.materia && p.cronogramaId === ponto.cronogramaId);
      const maxOrdem = subjectPoints.reduce((max, p) => Math.max(max, typeof p.ordem === 'number' ? p.ordem : 0), 0);

      const duplicated: PontoEstudo = {
        ...ponto,
        id: uid(),
        titulo: `${ponto.titulo} (Revisão)`,
        data: ponto.data ? addDays(ponto.data, 7) : ponto.data,
        lido: false,
        qFeitas: false,
        qTotal: '',
        qAcertos: '',
        dif: 'medio',
        ordem: maxOrdem + 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      return {
        ...prev,
        pontos: [...prev.pontos, duplicated]
      };
    });
  }, [setState]);

  const handleConfirmSplit = useCallback((pontoId: string, parts: Array<{ titulo: string; data: string }>, efeitoCascata: boolean) => {
    setState(prev => {
      const original = prev.pontos.find(p => p.id === pontoId);
      if (!original) return prev;

      const datesSelected = parts.map(p => p.data);
      const extraSessionsCount = datesSelected.length - 1;
      const firstSelectedDate = datesSelected[0];

      // Shift subsequent points of the same subject if cascade is enabled
      const daysToShift = extraSessionsCount * 7;

      const nextPontos = prev.pontos.map(p => {
        if (p.id === pontoId) {
          return {
            ...p,
            data: datesSelected[0], // primary date
            datas: datesSelected, // all selected dates
            updatedAt: Date.now()
          };
        }

        // Apply shift to other scheduled points of the same subject
        if (
          efeitoCascata &&
          daysToShift > 0 &&
          p.materia === original.materia &&
          p.cronogramaId === original.cronogramaId &&
          p.data &&
          p.data > firstSelectedDate
        ) {
          // Helper to add days to YYYY-MM-DD
          const shiftDateStr = (dStr: string, days: number) => {
            const [y, m, d] = dStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            dateObj.setDate(dateObj.getDate() + days);
            const rY = dateObj.getFullYear();
            const rM = String(dateObj.getMonth() + 1).padStart(2, '0');
            const rD = String(dateObj.getDate()).padStart(2, '0');
            return `${rY}-${rM}-${rD}`;
          };

          const newData = shiftDateStr(p.data, daysToShift);
          const newDatas = p.datas && p.datas.length > 0 
            ? p.datas.map(dStr => shiftDateStr(dStr, daysToShift))
            : undefined;

          return {
            ...p,
            data: newData,
            datas: newDatas,
            updatedAt: Date.now()
          };
        }

        return p;
      });

      return {
        ...prev,
        pontos: nextPontos
      };
    });
  }, [setState]);

  const handleMovePontoDate = useCallback((pontoId: string, newDate: string) => {
    handleUpdatePonto(pontoId, { data: newDate });
  }, [handleUpdatePonto]);

  const handleApplyReorganize = useCallback((reorgData: Record<string, string> | PontoEstudo[]) => {
    setState(prev => {
      const activeId = prev.activeCronogramaId;
      let nextPontos: PontoEstudo[];

      if (Array.isArray(reorgData)) {
        const reorgMap = new Map(reorgData.map(p => [p.id, p]));

        // Points belonging to other schedules
        const otherPoints = prev.pontos.filter(p => !(activeId === 'all' || p.cronogramaId === activeId));

        // Existing points of active schedule
        const currentActivePoints = activeId === 'all' 
          ? prev.pontos 
          : prev.pontos.filter(p => p.cronogramaId === activeId);

        // Update existing points, ensuring NONE are ever lost
        const updatedActivePoints = currentActivePoints.map(p => {
          if (reorgMap.has(p.id)) {
            return reorgMap.get(p.id)!;
          }
          // If point was omitted from reorgData (e.g. was already completed), keep it!
          // Clear its calendar date if it's completed so it is taken off the calendar,
          // but preserve the topic in state so it remains available in the materias tab.
          const isDone = Boolean(p.lido || (p.qFeitas && Number(p.qTotal) > 0));
          return {
            ...p,
            data: isDone ? '' : p.data,
            updatedAt: Date.now()
          };
        });

        // Any brand new points in reorgData that were not originally in currentActivePoints
        const existingIds = new Set(currentActivePoints.map(p => p.id));
        const brandNewPoints = reorgData.filter(p => !existingIds.has(p.id));

        const allActive = [...updatedActivePoints, ...brandNewPoints];
        // Sort active points strictly by logical ordem within each subject
        allActive.sort((a, b) => {
          if (a.materia !== b.materia) return a.materia.localeCompare(b.materia);
          const oA = typeof a.ordem === 'number' ? a.ordem : 999999;
          const oB = typeof b.ordem === 'number' ? b.ordem : 999999;
          if (oA !== oB) return oA - oB;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });

        nextPontos = [...otherPoints, ...allActive];
      } else if (reorgData && typeof reorgData === 'object') {
        nextPontos = prev.pontos.map(p => {
          if ((activeId === 'all' || p.cronogramaId === activeId) && reorgData[p.id] !== undefined) {
            return {
              ...p,
              data: reorgData[p.id],
              updatedAt: Date.now()
            };
          }
          return p;
        });
      } else {
        nextPontos = prev.pontos;
      }

      return {
        ...prev,
        pontos: nextPontos
      };
    });
  }, [setState]);

  return {
    handleUpdatePonto,
    handleDeletePonto,
    handleMovePonto,
    handleReorderPontos,
    handleSavePonto,
    handleDuplicatePonto,
    handleConfirmSplit,
    handleMovePontoDate,
    handleApplyReorganize
  };
}
