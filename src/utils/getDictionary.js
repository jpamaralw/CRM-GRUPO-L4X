// Third-party Imports
import 'server-only'

// Locales suportados (ver src/configs/i18n.js): pt (padrão) e en.
const dictionaries = {
  pt: () => import('@/data/dictionaries/pt.json').then(module => module.default),
  en: () => import('@/data/dictionaries/en.json').then(module => module.default)
}

// Fallback para pt se o locale não existir (evita 500 em rotas /pt/).
export const getDictionary = async locale => (dictionaries[locale] || dictionaries.pt)()
