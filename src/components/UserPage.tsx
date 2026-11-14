import { useState, type FormEvent } from 'react'
import type { Lang, Strings } from '@/i18n'

export type UserProfileData = {
  name: string
  activity: 'farmer' | 'advisor'
  farm: string
  region: string
}

export const emptyUserProfile: UserProfileData = {
  name: '',
  activity: 'farmer',
  farm: '',
  region: '',
}

export function loadUserProfile(): UserProfileData {
  if (typeof window === 'undefined') return emptyUserProfile

  try {
    const stored: unknown = JSON.parse(localStorage.getItem('agritech-profile') ?? 'null')
    if (!stored || typeof stored !== 'object') return emptyUserProfile

    const profile = stored as Partial<UserProfileData>
    return {
      name: typeof profile.name === 'string' ? profile.name : '',
      activity: profile.activity === 'advisor' ? 'advisor' : 'farmer',
      farm: typeof profile.farm === 'string' ? profile.farm : '',
      region: typeof profile.region === 'string' ? profile.region : '',
    }
  } catch {
    return emptyUserProfile
  }
}

type Props = {
  lang: Lang
  text: Strings
  profile: UserProfileData
  onBack: () => void
  onSave: (profile: UserProfileData) => boolean
}

export function UserPage({ lang, text, profile, onBack, onSave }: Props) {
  const [draft, setDraft] = useState(profile)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const initials = draft.name.trim()
    ? draft.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase(lang)).join('')
    : 'A'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveState(onSave({ ...draft, name: draft.name.trim(), farm: draft.farm.trim(), region: draft.region.trim() }) ? 'saved' : 'error')
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <button type="button" onClick={onBack} className="min-h-12 rounded-lg border-2 border-black bg-white px-4 font-bold text-leaf transition-colors hover:bg-leaf-soft">
        ← {text.backToMap}
      </button>

      <section className="mt-6 overflow-hidden rounded-2xl border-2 border-black bg-white">
        <div className="border-b-2 border-black bg-leaf-soft p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div aria-hidden="true" className="grid size-16 place-items-center rounded-full border-2 border-black bg-leaf text-xl font-extrabold text-white">
              {initials}
            </div>
            <div>
              <p className="text-base font-bold uppercase tracking-wider text-muted">AGRITECH</p>
              <h1 className="text-3xl font-extrabold text-leaf">{text.userPage}</h1>
              <p className="mt-1 text-base">{text.profileIntro}</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.75fr)] md:p-8">
          <div className="grid content-start gap-4">
            <h2 className="text-xl font-extrabold">{text.profile}</h2>

            <label className="grid gap-1 text-base font-bold" htmlFor="profile-name">
              <span>{text.profileName}</span>
              <input
                id="profile-name"
                autoComplete="name"
                required
                maxLength={80}
                value={draft.name}
                onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setSaveState('idle') }}
                className="min-h-12 rounded-lg border-2 border-black bg-white px-3 font-medium"
              />
            </label>

            <label className="grid gap-1 text-base font-bold" htmlFor="profile-activity">
              <span>{text.profileActivity}</span>
              <select
                id="profile-activity"
                value={draft.activity}
                onChange={(event) => { setDraft({ ...draft, activity: event.target.value as UserProfileData['activity'] }); setSaveState('idle') }}
                className="min-h-12 rounded-lg border-2 border-black bg-white px-3"
              >
                <option value="farmer">{text.farmer}</option>
                <option value="advisor">{text.advisor}</option>
              </select>
            </label>

            <label className="grid gap-1 text-base font-bold" htmlFor="profile-farm">
              <span>{text.farmName}</span>
              <input
                id="profile-farm"
                autoComplete="organization"
                maxLength={100}
                value={draft.farm}
                onChange={(event) => { setDraft({ ...draft, farm: event.target.value }); setSaveState('idle') }}
                className="min-h-12 rounded-lg border-2 border-black bg-white px-3 font-medium"
              />
            </label>

            <label className="grid gap-1 text-base font-bold" htmlFor="profile-region">
              <span>{text.region}</span>
              <input
                id="profile-region"
                autoComplete="address-level1"
                maxLength={100}
                value={draft.region}
                onChange={(event) => { setDraft({ ...draft, region: event.target.value }); setSaveState('idle') }}
                className="min-h-12 rounded-lg border-2 border-black bg-white px-3 font-medium"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" className="min-h-12 rounded-lg border-2 border-black bg-leaf px-5 font-extrabold text-white transition-colors hover:bg-[#174d1b]">
                {text.saveProfile}
              </button>
              {saveState !== 'idle' && (
                <p role={saveState === 'error' ? 'alert' : 'status'} className={`text-base font-bold ${saveState === 'error' ? 'text-poor' : 'text-good'}`}>
                  {saveState === 'saved' ? text.profileSaved : text.profileSaveError}
                </p>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-xl border-2 border-black bg-ochre-soft p-4">
            <h2 className="text-lg font-extrabold text-possible">{text.localProfile}</h2>
            <p className="mt-2 text-base">{text.localProfileHelp}</p>
            <p className="mt-4 border-t-2 border-black pt-3 text-base font-semibold">{text.privacyNote}</p>
          </aside>
        </form>
      </section>
    </main>
  )
}
