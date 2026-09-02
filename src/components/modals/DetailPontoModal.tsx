import React from 'react';
import { PontoEstudo } from '../../types';
import { StudyPointCard } from '../StudyPointCard';
import { X } from 'lucide-react';

interface DetailPontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ponto: PontoEstudo | null;
  materiaCor: string;
  onUpdatePonto: (id: string, updated: Partial<PontoEstudo>) => void;
  onDeletePonto: (id: string) => void;
  onEditPonto: (ponto: PontoEstudo) => void;
  onDuplicatePonto?: (ponto: PontoEstudo) => void;
}

export const DetailPontoModal: React.FC<DetailPontoModalProps> = ({
  isOpen,
  onClose,
  ponto,
  materiaCor,
  onUpdatePonto,
  onDeletePonto,
  onEditPonto,
  onDuplicatePonto
}) => {
  if (!isOpen || !ponto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
          <h2 className="font-sans font-semibold text-base text-zinc-900">
            Detalhes do ponto de estudo
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <StudyPointCard
            ponto={ponto}
            materiaCor={materiaCor}
            onUpdate={(updated) => onUpdatePonto(ponto.id, updated)}
            onDelete={() => {
              onDeletePonto(ponto.id);
              onClose();
            }}
            onEdit={() => {
              onClose();
              onEditPonto(ponto);
            }}
            onDuplicate={onDuplicatePonto ? () => {
              onDuplicatePonto(ponto);
              onClose();
            } : undefined}
          />
        </div>
      </div>
    </div>
  );
};
