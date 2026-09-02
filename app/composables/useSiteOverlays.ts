export type AccountDialogMode = 'profile' | 'reset'

export const useSiteOverlays = () => {
  const feedbackOpen = useState('feedback-dialog-open', () => false)
  const accountOpen = useState('account-dialog-open', () => false)
  const accountMode = useState<AccountDialogMode>('account-dialog-mode', () => 'profile')

  const openFeedback = () => {
    feedbackOpen.value = true
  }

  const openAccount = (mode: AccountDialogMode = 'profile') => {
    accountMode.value = mode
    accountOpen.value = true
  }

  return {
    feedbackOpen,
    accountOpen,
    accountMode,
    openFeedback,
    openAccount
  }
}
