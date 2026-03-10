import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeMedia } from '../../api/complejoApi';
import { X } from 'lucide-react';
import type { MediaFile } from '@shared/types/complejo';
import MediaUploadForm from './MediaUploadForm';

interface MediaGalleryProps {
  complejoId: string;
  media: MediaFile[];
}

export default function MediaGallery({ complejoId, media }: MediaGalleryProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => removeMedia(complejoId, mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complejos'] }),
  });

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Multimedia ({media.length})</h4>

      {media.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {media.map((m) => (
            <div key={m.id} className="relative group rounded overflow-hidden bg-gray-100">
              {m.tipo === 'image' ? (
                <img src={m.url} alt={m.caption ?? ''} className="w-full h-24 object-cover" />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-gray-200 text-xs text-gray-500">
                  Video
                </div>
              )}
              <button
                onClick={() => {
                  if (confirm('Eliminar esta imagen?')) {
                    deleteMutation.mutate(m.id);
                  }
                }}
                className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {m.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
                  {m.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Sin imagenes</p>
      )}

      <MediaUploadForm complejoId={complejoId} />
    </div>
  );
}
