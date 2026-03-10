import { env } from '../config/env.js';

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

let simulatorProfile: WhatsAppProfile = {
  about: 'Complejo de cabañas en la Patagonia',
  description: 'Bienvenido a nuestro complejo de alojamiento. Ofrecemos cabañas equipadas para disfrutar de la naturaleza.',
  address: 'Av. Los Arrayanes 1234, San Martín de los Andes',
  email: 'contacto@ejemplo.com',
  profile_picture_url: '',
  websites: ['https://www.ejemplo.com'],
  vertical: 'HOTEL',
};

function isSimulatorMode(): boolean {
  return env.SIMULATOR_MODE || !env.WA_PHONE_NUMBER_ID;
}

export async function getBusinessProfile(): Promise<WhatsAppProfile> {
  if (isSimulatorMode()) {
    return { ...simulatorProfile };
  }

  const url = `https://graph.facebook.com/${env.WA_API_VERSION}/${env.WA_PHONE_NUMBER_ID}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.WA_ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const data = json.data?.[0] ?? {};

  return {
    about: data.about ?? '',
    description: data.description ?? '',
    address: data.address ?? '',
    email: data.email ?? '',
    profile_picture_url: data.profile_picture_url ?? '',
    websites: data.websites ?? [],
    vertical: data.vertical ?? 'UNDEFINED',
  };
}

export async function updateBusinessProfile(data: WhatsAppProfileUpdate): Promise<{ success: boolean }> {
  if (isSimulatorMode()) {
    simulatorProfile = { ...simulatorProfile, ...data };
    return { success: true };
  }

  const url = `https://graph.facebook.com/${env.WA_API_VERSION}/${env.WA_PHONE_NUMBER_ID}/whatsapp_business_profile`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.WA_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...data }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API error ${res.status}: ${body}`);
  }

  return { success: true };
}
