const ONBOARDING_KEY = 'ninjaparent_onboarding_complete'
const PROFILE_KEY = 'ninjaparent_profile'
const OAUTH_RETURN_KEY = 'ninjaparent_oauth_return'
const ONBOARDING_STEP_KEY = 'ninjaparent_onboarding_step'

export interface ParentProfile {
  name: string
  email: string
  childCount: number
  children: Array<{ name: string; year: string; school: string }>
}

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true')
  localStorage.removeItem(ONBOARDING_STEP_KEY)
  localStorage.removeItem(OAUTH_RETURN_KEY)
}

export function getSavedStep(): number {
  const step = localStorage.getItem(ONBOARDING_STEP_KEY)
  return step ? parseInt(step, 10) : 0
}

export function saveStep(step: number): void {
  localStorage.setItem(ONBOARDING_STEP_KEY, String(step))
}

export function getProfile(): ParentProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ParentProfile
  } catch {
    return null
  }
}

export function saveProfile(profile: ParentProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function setOAuthReturnOnboarding(): void {
  localStorage.setItem(OAUTH_RETURN_KEY, 'onboarding')
}

export function isOAuthReturnOnboarding(): boolean {
  return localStorage.getItem(OAUTH_RETURN_KEY) === 'onboarding'
}

export function clearOAuthReturn(): void {
  localStorage.removeItem(OAUTH_RETURN_KEY)
}

export const DEFAULT_CHILDREN = [
  { name: 'Lily', year: 'Year 4', school: 'Oakwood Primary' },
  { name: 'Noah', year: 'Year 7', school: 'Riverside Academy' },
  { name: 'Mia', year: 'Year 2', school: 'Oakwood Primary' },
]
