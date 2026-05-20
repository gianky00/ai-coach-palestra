import { X } from 'lucide-react';
import { type FC, useState } from 'react';
import { toast } from 'react-hot-toast';

import { exerciseService } from '../services/exerciseService';

interface AddExerciseModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddExerciseModal: FC<AddExerciseModalProps> = ({ userId, onClose, onSuccess }) => {
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');

  const handleAddExercise = async () => {
    if (!newName.trim()) {
      toast.error("Il nome dell'esercizio è obbligatorio");
      return;
    }

    const { error } = await exerciseService.addExercise(userId, newName.trim(), newGroup.trim());

    if (error) {
      toast.error("Errore nell'aggiunta dell'esercizio");
    } else {
      toast.success('Esercizio aggiunto al catalogo');
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nuovo Esercizio</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="input-group">
            <label>Nome</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Es. Panca Piana"
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Gruppo Muscolare</label>
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Es. Petto"
            />
          </div>
          <button className="save-btn" onClick={handleAddExercise}>
            Salva nel Catalogo
          </button>
        </div>
      </div>
    </div>
  );
};
