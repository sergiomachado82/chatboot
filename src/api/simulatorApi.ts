import { apiFetch } from './apiClient';

export async function sendSimulatorMessage(body: string, from?: string) {
  return apiFetch<{ ok: boolean }>('/simulator/send', {
    method: 'POST',
    body: JSON.stringify({ body, from }),
  });
}

export async function sendSimulatorAudio(file: File, from?: string) {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

  return apiFetch<{ ok: boolean; transcripcion: string }>('/simulator/send-audio', {
    method: 'POST',
    body: JSON.stringify({ audio: base64, mimeType: file.type || 'audio/ogg', from }),
  });
}
