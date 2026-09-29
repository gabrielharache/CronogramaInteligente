import { useCallback, Dispatch, SetStateAction } from 'react';
import { AppState, Cronograma, Edital, PontoEstudo } from '../types';
import { uid } from '../utils/helpers';

// Cronograma CRUD, exam date and importing points into a cronograma
export function useCronogramas(setState: Dispatch<SetStateAction<AppState>>) {
  const handleSelectCronograma = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeCronogramaId: id
    }));
  }, [setState]);

  const handleSaveCronograma = useCallback((data: {
    id?: string;
    nome: string;
    descricao?: string;
    editalId?: string;
    dataProva?: string;
    cor?: string;
  }) => {
    setState(prev => {
      if (data.id) {
        const nextList = prev.cronogramas.map(c => {
          if (c.id === data.id) {
            return {
              ...c,
              nome: data.nome,
              descricao: data.descricao,
              editalId: data.editalId,
              dataProva: data.dataProva,
              cor: data.cor
            };
          }
          return c;
        });
        return { ...prev, cronogramas: nextList };
      } else {
        const newId = `cronograma-${uid()}`;
        const newCro: Cronograma = {
          id: newId,
          nome: data.nome,
          descricao: data.descricao,
          editalId: data.editalId,
          dataProva: data.dataProva,
          cor: data.cor || '#8C1C2C',
          createdAt: Date.now()
        };
        return {
          ...prev,
          cronogramas: [...prev.cronogramas, newCro],
          activeCronogramaId: newId
        };
      }
    });
  }, [setState]);

  const handleSaveExamDate = useCallback((newDate: string, editalIdToUpdate?: string) => {
    setState(prev => {
      // 1. Update active cronograma date
      let nextCronogramas = prev.cronogramas;
      if (prev.activeCronogramaId !== 'all') {
        nextCronogramas = prev.cronogramas.map(c => {
          if (c.id === prev.activeCronogramaId) {
            return { ...c, dataProva: newDate, editalId: editalIdToUpdate || c.editalId };
          }
          return c;
        });
      }

      // 2. Update target edital date if provided
      let nextEditais = prev.editais;
      if (editalIdToUpdate) {
        nextEditais = prev.editais.map(e => {
          if (e.id === editalIdToUpdate) {
            return { ...e, dataProva: newDate };
          }
          return e;
        });
      }

      return {
        ...prev,
        cronogramas: nextCronogramas,
        editais: nextEditais
      };
    });
  }, [setState]);

  const handleDeleteCronograma = useCallback((id: string) => {
    setState(prev => {
      const nextCro = prev.cronogramas.filter(c => c.id !== id);
      const nextPontos = prev.pontos.filter(p => p.cronogramaId !== id);
      const nextActiveId = prev.activeCronogramaId === id ? (nextCro[0]?.id || 'all') : prev.activeCronogramaId;
      return {
        ...prev,
        cronogramas: nextCro,
        pontos: nextPontos,
        activeCronogramaId: nextActiveId
      };
    });
  }, [setState]);

  const handleSwitchToCronograma = useCallback((cronogramaId: string) => {
    setState(prev => ({
      ...prev,
      activeCronogramaId: cronogramaId,
      ui: { ...prev.ui, activeTab: 'pontos' }
    }));
  }, [setState]);

  const handleCriarCronogramaParaEdital = useCallback((edital: Edital) => {
    const newId = `cronograma-${uid()}`;
    const newCro: Cronograma = {
      id: newId,
      nome: `${edital.nome} (${edital.cargo})`,
      descricao: `Cronograma personalizado para o concurso ${edital.nome}`,
      editalId: edital.id,
      cor: '#14524A',
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      cronogramas: [...prev.cronogramas, newCro],
      activeCronogramaId: newId,
      ui: { ...prev.ui, activeTab: 'pontos' }
    }));
  }, [setState]);

  const handleImportPointsToSchedule = useCallback((
    points: PontoEstudo[],
    destination: {
      type: 'new_cronograma' | 'append_current' | 'replace_current';
      newCronogramaNome?: string;
      newCronogramaEditalId?: string;
      targetCronogramaId?: string;
    }
  ) => {
    setState(prev => {
      let targetCronId = destination.targetCronogramaId || prev.activeCronogramaId;
      const nextCronogramas = [...prev.cronogramas];

      if (destination.type === 'new_cronograma') {
        const newId = destination.targetCronogramaId || `cronograma-${uid()}`;
        targetCronId = newId;
        const newCro: Cronograma = {
          id: newId,
          nome: destination.newCronogramaNome || 'Novo Cronograma',
          editalId: destination.newCronogramaEditalId || undefined,
          cor: '#3b82f6',
          createdAt: Date.now()
        };
        nextCronogramas.push(newCro);
      }

      const newPoints: PontoEstudo[] = points.map((item, idx) => ({
        id: item.id || (uid() + idx),
        cronogramaId: targetCronId,
        data: item.data || '',
        materia: item.materia || 'Geral',
        titulo: item.titulo || 'Tópico de Estudo',
        tipoEstudo: item.tipoEstudo || 'doutrina',
        artigosLei: item.artigosLei || '',
        jurisprudenciaRef: item.jurisprudenciaRef || '',
        notas: item.notas || '',
        lido: item.lido || false,
        qFeitas: item.qFeitas || false,
        qTotal: item.qTotal || '',
        qAcertos: item.qAcertos || '',
        dif: item.dif || null,
        showNotes: Boolean(item.notas),
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      }));

      let nextPontos = [...prev.pontos];
      if (destination.type === 'replace_current') {
        // Remove existing points of this schedule
        nextPontos = nextPontos.filter(p => p.cronogramaId !== targetCronId);
      }
      nextPontos.push(...newPoints);

      // Collect new subject colors if any
      const nextColors = { ...prev.materiasCores };
      newPoints.forEach(p => {
        if (!nextColors[p.materia]) {
          nextColors[p.materia] = '#52525b';
        }
      });

      return {
        ...prev,
        cronogramas: nextCronogramas,
        pontos: nextPontos,
        materiasCores: nextColors,
        activeCronogramaId: targetCronId,
        ui: { ...prev.ui, activeTab: 'pontos' }
      };
    });
  }, [setState]);

  return {
    handleSelectCronograma,
    handleSaveCronograma,
    handleSaveExamDate,
    handleDeleteCronograma,
    handleSwitchToCronograma,
    handleCriarCronogramaParaEdital,
    handleImportPointsToSchedule
  };
}
