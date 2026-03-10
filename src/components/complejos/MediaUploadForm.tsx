import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMedia } from '../../api/complejoApi';
import { Plus } from 'lucide-react';

interface MediaUploadFormProps {
  complejoId: string;
}

export default function MediaUploadForm({ complejoId }: MediaUploadFormProps) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [tipo, setTipo] = useState('image');
  const [caption, setCaption] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const mutation = useMutation({
    mutationFn: () => addMedia(complejoId, { url, tipo, caption: caption || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
      setUrl('');
      setCaption('');
      setShowPreview(false);
    },
  });

  function handleUrlBlur() {
    if (url && tipo === 'image') setShowPreview(true);
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
      <h4 className="text-sm font-semibold text-gray-700">Agregar multimedia</h4>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setShowPreview(false); }}
          onBlur={handleUrlBlur}
          placeholder="URL de imagen o video"
          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="image">Imagen</option>
          <option value="video">Video</option>
        </select>
      </div>
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (opcional)"
        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
      />
      {showPreview && url && tipo === 'image' && (
        <div className="w-32 h-20 rounded overflow-hidden bg-gray-100">
          <img src={url} alt="Preview" className="w-full h-full object-cover" onError={() => setShowPreview(false)} />
        </div>
      )}
      <button
        onClick={() => mutation.mutate()}
        disabled={!url || mutation.isPending}
        className="flex items-center gap-1 text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        <Plus size={14} />
        Agregar
      </button>
    </div>
  );
}
