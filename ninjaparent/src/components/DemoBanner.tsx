import { isDemoMode, isForceDemoMode } from '../lib/demoMode'
import { isLiveApiAvailable, isOAuthConfigured } from '../lib/apiStatus'

interface DemoBannerProps {
  onTryLive?: () => void
}

export function DemoBanner({ onTryLive }: DemoBannerProps) {
  if (!isDemoMode()) return null

  const liveReady = isLiveApiAvailable() && isOAuthConfigured()

  return (
    <div className="mx-5 mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <p className="font-semibold">Demo mode</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-800">
        {liveReady && isForceDemoMode()
          ? 'Real Gmail & Outlook are available. Open the app without ?demo=1 to connect your accounts.'
          : liveReady
            ? 'Sample data shown. Remove ?demo=1 from the URL to use your real inbox.'
            : 'Buttons use sample data. Deploy the API (see DEPLOY.md) and add OAuth keys to connect Gmail & Outlook.'}
      </p>
      {liveReady && onTryLive && isForceDemoMode() && (
        <button
          type="button"
          onClick={onTryLive}
          className="mt-2 text-xs font-semibold text-brand-700 underline"
        >
          Switch to live mode →
        </button>
      )}
    </div>
  )
}
