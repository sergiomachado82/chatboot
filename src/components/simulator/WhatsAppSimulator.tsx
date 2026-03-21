import { useState, useRef, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { notify } from '../../utils/notify';
import { sendSimulatorMessage, sendSimulatorAudio } from '../../api/simulatorApi';

interface SimMessage {
  from: 'user' | 'bot';
  type?: 'text' | 'image';
  body: string;
  imageUrl?: string;
  timestamp: string;
}

export default function WhatsAppSimulator() {
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.on(
      'simulator:mensaje',
      (data: { from: string; type?: string; body: string; imageUrl?: string; timestamp: string }) => {
        setMessages((prev) => [
          ...prev,
          {
            from: 'bot',
            type: (data.type as 'text' | 'image') || 'text',
            body: data.body,
            imageUrl: data.imageUrl,
            timestamp: data.timestamp,
          },
        ]);
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { from: 'user', type: 'text', body: text, timestamp: new Date().toISOString() }]);
    setInput('');
    setSending(true);

    try {
      await sendSimulatorMessage(text);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || sending) return;
    e.target.value = '';

    setMessages((prev) => [
      ...prev,
      { from: 'user', type: 'text', body: `[Nota de voz: ${file.name}]`, timestamp: new Date().toISOString() },
    ]);
    setSending(true);

    try {
      const result = await sendSimulatorAudio(file);
      setMessages((prev) => [
        ...prev,
        {
          from: 'user',
          type: 'text',
          body: `Transcripcion: "${result.transcripcion}"`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Error al procesar audio');
      setMessages((prev) => [
        ...prev,
        { from: 'user', type: 'text', body: '[Error al procesar audio]', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-lg font-bold">A</div>
        <div>
          <div className="font-semibold text-sm">Las Grutas Deptos</div>
          <div className="text-xs opacity-80">Simulador WhatsApp</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#e5ddd5]">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-8">
            Escribe un mensaje para simular una conversacion de WhatsApp
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                msg.from === 'user' ? 'bg-green-100 text-gray-800' : 'bg-white text-gray-800'
              }`}
            >
              {msg.type === 'image' && msg.imageUrl ? (
                <div>
                  <img
                    src={msg.imageUrl}
                    alt="Foto del departamento"
                    className="rounded-md w-full max-h-48 object-cover mb-1"
                    loading="lazy"
                  />
                  {msg.body && <p className="mt-1">{msg.body}</p>}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.body}</p>
              )}
              <p className="text-[10px] text-gray-400 text-right mt-1">
                {new Date(msg.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 bg-gray-100 flex gap-2">
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
        <button
          onClick={() => audioInputRef.current?.click()}
          disabled={sending}
          className="bg-gray-200 text-gray-600 px-3 py-2 rounded-full text-sm hover:bg-gray-300 disabled:opacity-50"
          title="Enviar nota de voz"
        >
          🎤
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
