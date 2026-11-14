import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Reason, Texture, Verdict } from '@/api/client'

export type Lang = 'fr' | 'en'

const reasonFr = {
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
}

const reasonEn = {
  'rain.ok': 'Rainfall fits ({value} mm, ideal {min}–{max})',
  'rain.tooLow': 'Not enough rain ({value} mm, ideal {min}–{max})',
  'rain.tooHigh': 'Too much rain ({value} mm, ideal {min}–{max})',
  'temp.ok': 'Temperature is suitable ({value} °C, ideal {min}–{max})',
  'temp.tooLow': 'Too cold ({value} °C, ideal {min}–{max})',
  'temp.tooHigh': 'Too hot ({value} °C, ideal {min}–{max})',
  'ph.ok': 'Soil pH fits ({value}, ideal {min}–{max})',
  'ph.tooLow': 'Soil is too acidic (pH {value}, ideal {min}–{max})',
  'ph.tooHigh': 'Soil is too alkaline (pH {value}, ideal {min}–{max})',
  'texture.ok': '{texture} soil suits it',
  'texture.unsuited': '{texture} soil is a poor fit',
  'dryMonths.ok': 'Dry season fits ({value} months, ideal {min}–{max})',
  'dryMonths.tooLow': 'Dry season is too short ({value} months, ideal {min}–{max})',
  'dryMonths.tooHigh': 'Dry season is too long ({value} months, ideal {min}–{max})',
  'water.irrigate': 'Plan ~{mm} mm of irrigation',
} satisfies typeof reasonFr

const dict = {
  fr: {
    town: 'Ville',
    chooseTown: 'Choisir une ville',
    plantingMonth: 'Mois de semis',
    auto: 'Automatique (prochaine saison des pluies)',
    irrigation: 'Irrigation possible',
    analyze: 'Analyser',
    analyzing: 'Analyse en cours…',
    useLocation: 'Ma position',
    locating: 'Localisation…',
    pickHint: 'Touchez la carte, utilisez votre position ou choisissez une ville.',
    results: 'Résultats',
    back: '← Retour aux résultats',
    sowing: 'semis',
    perYear: 'mm/an',
    since: 'depuis 1984–1993',
    rain: 'Pluie',
    deficit: (mm: number) => `Prévoir environ ${mm} mm d’irrigation`,
    monthlyRain: 'Pluie mensuelle (mm), 2014–2023',
    cycle: 'Cycle de culture',
    unavailable: 'Le service de données est indisponible. Réessayez dans un instant.',
    outside: 'Choisissez un point en Côte d’Ivoire.',
    sample: 'NASA POWER est injoignable : climat enregistré pour la ville la plus proche.',
    noSoil: 'Pas de données de sol ici. Choisissez un point sur la terre ferme.',
    climateUnavailable: 'Les données climatiques sont momentanément indisponibles pour ce lieu. Réessayez.',
    networkError: 'Connexion au service impossible. Vérifiez votre réseau puis réessayez.',
    locationError: 'Impossible d’obtenir votre position. Vérifiez l’autorisation de localisation puis réessayez.',
    cropsUnavailable: 'Impossible de charger les cultures. Vérifiez la connexion au service.',
    changed: 'Les réglages ont changé. Relancez l’analyse pour actualiser les résultats.',
    languageLabel: 'Langue',
    mapLabel: 'Carte de sélection du terrain',
    siteSummary: 'Résumé du site',
    fieldShift: 'Field Shift',
    fieldShiftHelp: 'Comparaison des moyennes climatiques récentes par rapport à la référence historique.',
    note: 'Les recommandations sont indicatives. Vérifiez localement les profils agronomiques et les conditions du terrain.',
    verdict: { good: 'Bon', possible: 'Possible', poor: 'Faible' } satisfies Record<Verdict, string>,
    factor: { rain: 'Pluie', temp: 'Température', ph: 'pH du sol', texture: 'Texture', dryMonths: 'Mois secs' },
    texture: {
      sand: 'sableux',
      sandy_loam: 'sablo-limoneux',
      loam: 'limoneux',
      clay_loam: 'argilo-limoneux',
      clay: 'argileux',
    } satisfies Record<Texture, string>,
    months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    reason: reasonFr as Record<string, string>,
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
    locating: 'Finding location…',
    pickHint: 'Tap the map, use your location, or choose a town.',
    results: 'Results',
    back: '← Back to results',
    sowing: 'planting',
    perYear: 'mm/yr',
    since: 'since 1984–1993',
    rain: 'Rainfall',
    deficit: (mm: number) => `Plan about ${mm} mm of irrigation`,
    monthlyRain: 'Monthly rainfall (mm), 2014–2023',
    cycle: 'Growing cycle',
    unavailable: 'The data service is unavailable. Try again shortly.',
    outside: 'Choose a point in Côte d’Ivoire.',
    sample: 'NASA POWER is unreachable: showing saved climate for the nearest town.',
    noSoil: 'No soil data here. Pick a point on land.',
    climateUnavailable: 'Climate data is temporarily unavailable for this location. Please try again.',
    networkError: 'Could not connect to the service. Check your network and try again.',
    locationError: 'Could not get your location. Check location permission and try again.',
    cropsUnavailable: 'Could not load crops. Check the service connection.',
    changed: 'Settings changed. Run the analysis again to update your results.',
    languageLabel: 'Language',
    mapLabel: 'Field selection map',
    siteSummary: 'Site summary',
    fieldShift: 'Field Shift',
    fieldShiftHelp: 'Compare recent climate conditions with the historical reference period.',
    note: 'Recommendations are indicative only. Check local agronomic conditions and field conditions before acting.',
    verdict: { good: 'Good', possible: 'Possible', poor: 'Poor' } satisfies Record<Verdict, string>,
    factor: { rain: 'Rainfall', temp: 'Temperature', ph: 'Soil pH', texture: 'Texture', dryMonths: 'Dry months' },
    texture: {
      sand: 'sandy',
      sandy_loam: 'sandy loam',
      loam: 'loam',
      clay_loam: 'clay loam',
      clay: 'clay',
    } satisfies Record<Texture, string>,
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    reason: reasonEn as Record<string, string>,
  },
}

export type Strings = (typeof dict)['fr']

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: Strings }>({
  lang: 'fr',
  setLang: () => {},
  t: dict.fr,
})

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('agritech-lang')
    if (saved === 'fr' || saved === 'en') return saved
  } catch {
    // Storage can be disabled.
  }

  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem('agritech-lang', lang)
    } catch {
      // Storage can be disabled.
    }
  }, [lang])

  return <LangContext.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

export function reasonText(t: Strings, { key, params }: Reason) {
  const template = t.reason[key] ?? key
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    if (name === 'texture') return t.texture[value as Texture] ?? String(value)
    return String(value ?? '')
  })
}

