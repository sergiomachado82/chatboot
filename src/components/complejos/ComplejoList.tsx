import { useState } from 'react';
import { useComplejos } from '../../hooks/useComplejos';
import { Plus } from 'lucide-react';
import type { Complejo } from '@shared/types/complejo';
import ComplejoCard from './ComplejoCard';
import ComplejoEditModal from './ComplejoEditModal';
import ResumenPanel from './ResumenPanel';
import { CardSkeleton } from '../ui/Skeleton';

export default function ComplejoList() {
  const { data: complejos, isLoading } = useComplejos();
  const [editingComplejo, setEditingComplejo] = useState<Complejo | null>(null);
  const [showModal, setShowModal] = useState(false);

  function handleEdit(complejo: Complejo) {
    setEditingComplejo(complejo);
    setShowModal(true);
  }

  function handleCreate() {
    setEditingComplejo(null);
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setEditingComplejo(null);
  }

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Complejos</h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Agregar</span> Depto
          </button>
        </div>

        {isLoading && <CardSkeleton count={4} />}

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {complejos?.map((c) => (
              <ComplejoCard key={c.id} complejo={c} onEdit={() => handleEdit(c)} />
            ))}
          </div>
          {complejos?.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p className="text-sm">No hay departamentos registrados</p>
              <button
                onClick={handleCreate}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Agregar el primero
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block w-72 flex-shrink-0 overflow-y-auto">
        {complejos && <ResumenPanel complejos={complejos} />}
      </div>

      {/* Modal */}
      {showModal && (
        <ComplejoEditModal complejo={editingComplejo} onClose={handleClose} />
      )}
    </div>
  );
}
