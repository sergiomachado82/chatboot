import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
export const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número';

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .regex(PASSWORD_REGEX, PASSWORD_MESSAGE);
