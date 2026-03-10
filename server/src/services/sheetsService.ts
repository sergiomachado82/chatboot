import { google } from 'googleapis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function getAuth() {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SHEET_ID) {
    return null;
  }

  return new google.auth.JWT(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

interface ReservaRow {
  id: string;
  huespedNombre: string;
  huespedWaId: string;
  huespedTelefono: string;
  habitacion: string;
  fechaEntrada: string;
  fechaSalida: string;
  numHuespedes: number;
  precioTotal: number;
  estado: string;
  notas: string;
  creadoEn: string;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = (i + 1) * 1000;
      logger.warn({ attempt: i + 1, delay }, 'Sheets retry after failure');
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

export async function syncReservaToSheet(reserva: ReservaRow): Promise<void> {
  const auth = getAuth();
  if (!auth) {
    logger.debug('Google Sheets not configured, skipping sync');
    return;
  }

  try {
    await withRetry(async () => {
      const sheets = google.sheets({ version: 'v4', auth });
      const sheetId = env.GOOGLE_SHEET_ID;

      const searchResult = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Reservas!A:A',
      });

      const rows = searchResult.data.values ?? [];
      const rowIndex = rows.findIndex((row) => row[0] === reserva.id);

      const rowData = [
        reserva.id,
        reserva.huespedNombre,
        reserva.huespedWaId,
        reserva.huespedTelefono,
        reserva.habitacion,
        reserva.fechaEntrada,
        reserva.fechaSalida,
        reserva.numHuespedes,
        reserva.precioTotal,
        reserva.estado,
        reserva.notas,
        reserva.creadoEn,
        new Date().toISOString(),
      ];

      if (rowIndex > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `Reservas!A${rowIndex + 1}:M${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [rowData] },
        });
        logger.info({ reservaId: reserva.id }, 'Reserva updated in Google Sheet');
      } else {
        if (rows.length === 0) {
          await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Reservas!A:M',
            valueInputOption: 'RAW',
            requestBody: {
              values: [['ID', 'Huesped', 'WhatsApp', 'Telefono', 'Habitacion', 'Entrada', 'Salida', 'Personas', 'Total', 'Estado', 'Notas', 'Creada', 'Actualizada']],
            },
          });
        }

        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: 'Reservas!A:M',
          valueInputOption: 'RAW',
          requestBody: { values: [rowData] },
        });
        logger.info({ reservaId: reserva.id }, 'Reserva added to Google Sheet');
      }
    });
  } catch (err) {
    logger.error({ err }, 'Failed to sync reserva to Google Sheet after retries');
  }
}
