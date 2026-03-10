import { apiFetch } from './apiClient';

export interface WhatsAppProfile {
  about: string;
  description: string;
  address: string;
  email: string;
  profile_picture_url: string;
  websites: string[];
  vertical: string;
}

export interface WhatsAppProfileUpdate {
  about?: string;
  description?: string;
  address?: string;
  email?: string;
  websites?: string[];
  vertical?: string;
}

export function getWhatsAppProfile() {
  return apiFetch<WhatsAppProfile>('/whatsapp/profile');
}

export function updateWhatsAppProfile(data: WhatsAppProfileUpdate) {
  return apiFetch<{ success: boolean }>('/whatsapp/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
