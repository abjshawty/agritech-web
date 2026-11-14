import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Reason, Texture, Verdict } from '@/api/client'

export type Lang = 'fr' | 'en'

// Every string the UI shows lives here. The API sends keys, never sentences.
const dict = {
  fr: {
    town: 'Ville',
    chooseTown: 'Choisir une ville',
    plantingMonth: 'Mois de semis',
    auto: 'Automatique (prochaine saison des pluies)',
    irrigation: 'Irrigation possible',
    analyze: 'Analyser',
    analyzing: 'Analyse…',
    useLocation: 'Ma position',
    pickHint: 'Touchez la carte, utilisez votre position ou choisissez une ville.',
    results: 'Résultats',
    back: '← Résultats',
    sowing: 'semis',
    perYear: 'mm/an',
    since: 'depuis 1984–93',
    rain: 'Pluie',
    deficit: (mm: number) => `Manque ~${mm} mm`,
    monthlyRain: 'Pluie mensuelle (mm), 2014–2023',
    cycle: 'Cycle de culture',
    unavailable: 'Le service de données est indisponible. Réessayez dans un instant.',
    outside: 'Choisissez un point en Côte d’Ivoire.',
    sample: 'NASA POWER est injoignable : climat enregistré de la ville la plus proche',
    noSoil: 'Pas de données de sol ici. Choisissez un point sur la terre ferme.',
    factor: { rain: 'Pluie', temp: 'Température', ph: 'pH', texture: 'Texture', dryMonths: 'Mois secs' },
    verdict: { good: 'Bon', possible: 'Possible', poor: 'Faible' } satisfies Record<Verdict, string>,
    texture: {
      sand: 'sableux',
      sandy_loam: 'sablo-limoneux',
      loam: 'limoneux',
      clay_loam: 'argilo-limoneux',
      clay: 'argileux',
    } satisfies Record<Texture, string>,
    months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    reason: {
      'rain.ok': 'Pluie dans l’idéal ({value} mm, idéal {min}–{max})',
      'rain.tooLow': 'Pas assez de pluie ({value} mm, idéal {min}–{max})',
      'rain.tooHigh': 'Trop de pluie ({value} mm, idéal {min}–{max})',
      'temp.ok': 'Température adaptée ({value} °C, idéal {min}–{max})',
      'temp.tooLow': 'Trop froid ({value} °C, idéal {min}–{max})',
      'temp.tooHigh': 'Trop chaud ({value} °C, idéal {min}–{max})',
      'ph.ok': 'pH du sol adapté ({value}, idéal {min}–{max})',
      'ph.tooLow': 'Sol trop acide (pH {value}, idéal {min}–{max})',
      'ph.tooHigh': 'Sol trop basique (pH {value}, idéal {min}–{max})',
      'texture.ok': 'Sol {texture} adapté',
      'texture.unsuited': 'Sol {texture} peu adapté',
      'dryMonths.ok': 'Saison sèche adaptée ({value} mois, idéal {min}–{max})',
      'dryMonths.tooLow': 'Saison sèche trop courte ({value} mois, idéal {min}–{max})',
      'dryMonths.tooHigh': 'Saison sèche trop longue ({value} mois, idéal {min}–{max})',
      'water.irrigate': 'Prévoir ~{mm} mm d’irrigation',
    } as Record<string, string>,
  },
  en: {
    town: 'Town',
    chooseTown: 'Choose a town',
    plantingMonth: 'Planting month',
    auto: 'Automatic (next rainy season)',
    irrigation: 'Irrigation available',
    analyze: 'Analyze',
    analyzing: 'Analyzing…',
    useLocation: 'My location',
    pickHint: 'Tap the map, use your location, or choose a town.',
    results: 'Results',
    back: '← Results',
    sowing: 'planting',
    perYear: 'mm/yr',
    since: 'since 1984–93',
    rain: 'Rain',
    deficit: (mm: number) => `Short by ~${mm} mm`,
    monthlyRain: 'Monthly rainfall (mm), 2014–2023',
    cycle: 'Growing cycle',
    unavailable: 'The data service is unavailable. Try again in a moment.',
    outside: 'Pick a point in Côte d’Ivoire.',
    sample: 'NASA POWER is unreachable: showing the nearest town’s saved climate',
    noSoil: 'No soil data here. Pick a point on land.',
    factor: { rain: 'Rain', temp: 'Temperature', ph: 'pH', texture: 'Texture', dryMonths: 'Dry months' },
    verdict: { good: 'Good', possible: 'Possible', poor: 'Poor' } satisfies Record<Verdict, string>,
    texture: {
      sand: 'sandy',
      sandy_loam: 'sandy loam',
      loam: 'loam',
      clay_loam: 'clay loam',
      clay: 'clay',
    } satisfies Record<Texture, string>,
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    reason: {
      'rain.ok': 'Rainfall fits ({value} mm, ideal {min}–{max})',
      'rain.tooLow': 'Not enough rain ({value} mm, ideal {min}–{max})',
      'rain.tooHigh': 'Too much rain ({value} mm, ideal {min}–{max})',
      'temp.ok': 'Temperature fits ({value} °C, ideal {min}–{max})',
      'temp.tooLow': 'Too cold ({value} °C, ideal {min}–{max})',
      'temp.tooHigh': 'Too hot ({value} °C, ideal {min}–{max})',
      'ph.ok': 'Soil pH fits ({value}, ideal {min}–{max})',
      'ph.tooLow': 'Soil too acidic (pH {value}, ideal {min}–{max})',
      'ph.tooHigh': 'Soil too alkaline (pH {value}, ideal {min}–{max})',
      'texture.ok': '{texture} soil suits it',
      'texture.unsuited': '{texture} soil is a poor fit',
      'dryMonths.ok': 'Dry season fits ({value} months, ideal {min}–{max})',
      'dryMonths.tooLow': 'Dry season too short ({value} months, ideal {min}–{max})',
      'dryMonths.tooHigh': 'Dry season too long ({value} months, ideal {min}–{max})',
      'water.irrigate': 'Plan ~{mm} mm of irrigation',
    } as Record<string, string>,
  },
}

export type Strings = (typeof dict)['fr']

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Strings }>({
  lang: 'fr',
  setLang: () => {},
  t: dict.fr,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  return <LangContext.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

/** Turn a reason key and its params into a sentence in the current language. */
export function reasonText(t: Strings, { key, params }: Reason) {
  const template = t.reason[key] ?? key
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    if (name === 'texture') return t.texture[value as Texture] ?? String(value)
    return String(value ?? '')
  })
}
