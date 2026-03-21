import toast from 'react-hot-toast';
import { createElement } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

function iconToast(
  message: string,
  icon: typeof CheckCircle,
  color: string,
  opts?: { duration?: number },
) {
  return toast(message, {
    icon: createElement(icon, { size: 18, color }),
    duration: opts?.duration,
  });
}

export const notify = {
  success: (msg: string) => iconToast(msg, CheckCircle, '#16a34a', { duration: 3000 }),
  error: (msg: string) => iconToast(msg, XCircle, '#dc2626', { duration: 5000 }),
  warning: (msg: string) => iconToast(msg, AlertTriangle, '#d97706', { duration: 4000 }),
  info: (msg: string) => iconToast(msg, Info, '#2563eb', { duration: 3000 }),
};
