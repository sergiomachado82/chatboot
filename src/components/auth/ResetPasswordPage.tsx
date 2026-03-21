import { useState, type FormEvent } from 'react';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resetPasswordApi } from '../../api/authApi';
import AuthLayout from './AuthLayout';

interface ResetPasswordPageProps {
  token: string;
  onBack: () => void;
}

export default function ResetPasswordPage({ token, onBack }: ResetPasswordPageProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('resetPassword.errorMinLength'));
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
      setError(t('resetPassword.errorComplexity'));
      return;
    }

    if (password !== confirm) {
      setError(t('resetPassword.errorMismatch'));
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {success ? (
        <div className="space-y-4 text-center" role="status">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={28} />
            </div>
          </div>
          <p className="text-green-700 font-medium">{t('resetPassword.successMessage')}</p>
          <button
            onClick={onBack}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 font-medium shadow-md shadow-blue-500/20 transition-all"
          >
            {t('resetPassword.goToLogin')}
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 text-center mb-4">
            {t('resetPassword.title')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-password"
                className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
              >
                {t('resetPassword.newPassword')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:text-gray-100"
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('resetPassword.passwordHint')}</p>
            </div>
            <div>
              <label
                htmlFor="reset-confirm"
                className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
              >
                {t('resetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:text-gray-100"
                  placeholder={t('resetPassword.confirmPlaceholder')}
                  required
                  minLength={6}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="text-red-500 text-sm bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              {loading ? t('resetPassword.saving') : t('resetPassword.save')}
            </button>
          </form>
          <button
            onClick={onBack}
            className="mt-4 w-full text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} /> {t('auth.backToLogin')}
          </button>
        </>
      )}
    </AuthLayout>
  );
}
