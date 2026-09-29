import { useCallback, Dispatch, SetStateAction } from 'react';
import { AppState } from '../types';

// Subject (matéria) colors, creation, renaming and deletion
export function useMaterias(setState: Dispatch<SetStateAction<AppState>>) {
  const handleUpdateSubjectColor = useCallback((materia: string, novaCor: string) => {
    setState(prev => ({
      ...prev,
      materiasCores: {
        ...prev.materiasCores,
        [materia]: novaCor
      }
    }));
  }, [setState]);

  const handleAddSubject = useCallback((materia: string, cor: string) => {
    setState(prev => ({
      ...prev,
      materiasCores: {
        ...prev.materiasCores,
        [materia]: cor
      }
    }));
  }, [setState]);

  const handleDeleteSubject = useCallback((materia: string) => {
    setState(prev => {
      const nextColors = { ...prev.materiasCores };
      delete nextColors[materia];

      return {
        ...prev,
        pontos: prev.pontos.filter(p => p.materia !== materia),
        materiasCores: nextColors
      };
    });
  }, [setState]);

  const handleRenameSubject = useCallback((antigoNome: string, novoNome: string) => {
    setState(prev => {
      const nextColors = { ...prev.materiasCores };
      if (nextColors[antigoNome] !== undefined) {
        nextColors[novoNome] = nextColors[antigoNome];
        delete nextColors[antigoNome];
      }

      const nextPoints = prev.pontos.map(p => {
        if (p.materia === antigoNome) {
          return {
            ...p,
            materia: novoNome,
            updatedAt: Date.now()
          };
        }
        return p;
      });

      return {
        ...prev,
        pontos: nextPoints,
        materiasCores: nextColors
      };
    });
  }, [setState]);

  return {
    handleUpdateSubjectColor,
    handleAddSubject,
    handleDeleteSubject,
    handleRenameSubject
  };
}
