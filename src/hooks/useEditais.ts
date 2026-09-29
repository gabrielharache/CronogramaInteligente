import { useCallback, Dispatch, SetStateAction } from 'react';
import confetti from 'canvas-confetti';
import { AppState, Cronograma, Edital, EditalStatus, PontoEstudo, TipoEstudo } from '../types';
import { uid, hojeStr, parseEditalMarkdown, parseMarkdownStudyPoints, distributePlannedDates } from '../utils/helpers';

// Edital CRUD and edital imports (smart structurer and Markdown), which also create a linked cronograma
export function useEditais(setState: Dispatch<SetStateAction<AppState>>) {
  const handleUpdateEdital = useCallback((id: string, updated: Partial<Edital>) => {
    setState(prev => ({
      ...prev,
      editais: prev.editais.map(e => e.id === id ? { ...e, ...updated } : e)
    }));
  }, [setState]);

  const handleDeleteEdital = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      editais: prev.editais.filter(e => e.id !== id),
      cronogramas: prev.cronogramas.map(c => c.editalId === id ? { ...c, editalId: undefined } : c)
    }));
  }, [setState]);

  const handleSaveEdital = useCallback((editalData: {
    id?: string;
    nome: string;
    cargo: string;
    banca: string;
    dataProva: string;
    status: EditalStatus;
    conteudo: string;
  }) => {
    setState(prev => {
      if (editalData.id) {
        const nextEditais = prev.editais.map(e => {
          if (e.id === editalData.id) {
            return {
              ...e,
              nome: editalData.nome,
              cargo: editalData.cargo,
              banca: editalData.banca,
              dataProva: editalData.dataProva,
              status: editalData.status,
              conteudo: editalData.conteudo
            };
          }
          return e;
        });
        return { ...prev, editais: nextEditais };
      } else {
        const newEdital: Edital = {
          id: uid(),
          nome: editalData.nome,
          cargo: editalData.cargo,
          banca: editalData.banca,
          dataProva: editalData.dataProva,
          status: editalData.status,
          conteudo: editalData.conteudo
        };
        return {
          ...prev,
          editais: [...prev.editais, newEdital]
        };
      }
    });
  }, [setState]);

  const handleConfirmSmartImport = useCallback((payload: {
    edital: {
      nome: string;
      cargo: string;
      banca: string;
      dataProva: string;
      status: EditalStatus;
      conteudo: string;
    };
    cronograma: {
      nome: string;
      descricao: string;
      dataProva: string;
      cor: string;
    };
    studyPlan: Array<{
      materia: string;
      titulo: string;
      tipoEstudo: TipoEstudo;
      artigosLei?: string;
      jurisprudenciaRef?: string;
      notas?: string;
      data: string;
    }>;
  }) => {
    const newEditalId = uid();
    const newCroId = uid();

    const newEdital: Edital = {
      id: newEditalId,
      nome: payload.edital.nome,
      cargo: payload.edital.cargo,
      banca: payload.edital.banca,
      dataProva: payload.edital.dataProva,
      status: payload.edital.status,
      conteudo: payload.edital.conteudo,
      createdAt: Date.now()
    };

    const newCronograma: Cronograma = {
      id: newCroId,
      nome: payload.cronograma.nome,
      descricao: payload.cronograma.descricao,
      editalId: newEditalId,
      dataProva: payload.cronograma.dataProva,
      cor: payload.cronograma.cor || '#8C1C2C',
      createdAt: Date.now()
    };

    // Group by materia to assign sequential logical sequence (ordem: 1, 2, 3...)
    const subjectOrderCounts: Record<string, number> = {};
    const newPontos: PontoEstudo[] = payload.studyPlan.map((p, idx) => {
      subjectOrderCounts[p.materia] = (subjectOrderCounts[p.materia] || 0) + 1;
      return {
        id: uid() + idx + Math.random().toString(36).slice(2, 6),
        cronogramaId: newCroId,
        data: p.data,
        materia: p.materia,
        titulo: p.titulo,
        tipoEstudo: p.tipoEstudo,
        artigosLei: p.artigosLei || '',
        jurisprudenciaRef: p.jurisprudenciaRef || '',
        notas: p.notas || '',
        lido: false,
        qFeitas: false,
        qTotal: '',
        qAcertos: '',
        dif: null,
        showNotes: Boolean(p.notas),
        ordem: subjectOrderCounts[p.materia],
        createdAt: Date.now() + idx,
        updatedAt: Date.now() + idx
      };
    });

    setState(prev => {
      const nextColors = { ...prev.materiasCores };
      newPontos.forEach(p => {
        if (!nextColors[p.materia]) {
          nextColors[p.materia] = '#8C1C2C';
        }
      });

      return {
        ...prev,
        editais: [newEdital, ...prev.editais],
        cronogramas: [...prev.cronogramas, newCronograma],
        pontos: [...prev.pontos, ...newPontos],
        materiasCores: nextColors,
        activeCronogramaId: newCroId,
        ui: {
          ...prev.ui,
          activeTab: 'cronograma'
        }
      };
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, [setState]);

  const handleImportEditalFromMd = useCallback((parsed: ReturnType<typeof parseEditalMarkdown>) => {
    const newEditalId = uid();
    const newEdital: Edital = {
      id: newEditalId,
      nome: parsed.nome,
      cargo: parsed.cargo,
      banca: parsed.banca,
      dataProva: parsed.dataProva,
      status: parsed.status,
      conteudo: parsed.conteudo,
      createdAt: Date.now()
    };

    // Check if there are markdown study points in the content
    const parsedPoints = parseMarkdownStudyPoints(parsed.conteudo);
    const newCroId = uid();
    const newCronograma: Cronograma = {
      id: newCroId,
      nome: `${parsed.nome}${parsed.cargo ? ` (${parsed.cargo})` : ''}`,
      descricao: `Cronograma gerado a partir do edital ${parsed.nome}`,
      editalId: newEditalId,
      dataProva: parsed.dataProva,
      cor: '#8C1C2C',
      createdAt: Date.now()
    };

    let newPontoItems: PontoEstudo[] = [];
    if (parsedPoints.length > 0) {
      const dates = distributePlannedDates(parsedPoints.length, {
        startDate: hojeStr(),
        topicsPerDay: 2,
        studyDaysMode: 'seg-sab'
      });

      const subjectOrderCounts: Record<string, number> = {};
      newPontoItems = parsedPoints.map((p, idx) => {
        const mat = p.materia || 'Geral';
        subjectOrderCounts[mat] = (subjectOrderCounts[mat] || 0) + 1;
        return {
          id: uid() + idx,
          cronogramaId: newCroId,
          data: p.data || dates[idx] || hojeStr(),
          materia: mat,
          titulo: p.titulo,
          tipoEstudo: p.tipoEstudo || 'doutrina',
          artigosLei: p.artigosLei || '',
          jurisprudenciaRef: p.jurisprudenciaRef || '',
          notas: p.notas || '',
          lido: false,
          qFeitas: false,
          qTotal: '',
          qAcertos: '',
          dif: null,
          showNotes: Boolean(p.notas),
          ordem: subjectOrderCounts[mat],
          createdAt: Date.now() + idx,
          updatedAt: Date.now() + idx
        };
      });
    }

    setState(prev => {
      // Collect new subject colors if any
      const nextMateriasCores = { ...prev.materiasCores };
      newPontoItems.forEach(p => {
        if (!nextMateriasCores[p.materia]) {
          nextMateriasCores[p.materia] = '#52525b';
        }
      });

      return {
        ...prev,
        editais: [newEdital, ...prev.editais],
        cronogramas: [...prev.cronogramas, newCronograma],
        pontos: [...prev.pontos, ...newPontoItems],
        materiasCores: nextMateriasCores,
        activeCronogramaId: newCroId
      };
    });
  }, [setState]);

  return {
    handleUpdateEdital,
    handleDeleteEdital,
    handleSaveEdital,
    handleConfirmSmartImport,
    handleImportEditalFromMd
  };
}
