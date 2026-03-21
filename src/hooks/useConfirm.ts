import { useState, useCallback } from 'react';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
}

const INITIAL: ConfirmState = {
  open: false,
  title: '',
  message: '',
  onConfirm: () => {},
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(INITIAL);

  const confirm = useCallback(
    (opts: Omit<ConfirmState, 'open'>) => {
      setState({ ...opts, open: true });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    setState(INITIAL);
  }, [state]);

  const handleCancel = useCallback(() => {
    setState(INITIAL);
  }, []);

  return {
    confirmState: state,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
