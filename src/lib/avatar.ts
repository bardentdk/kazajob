/**
 * KAZAJOB — Système d'avatar DiceBear Avataaars
 * Style cartoon/comic avec contours noirs, représentatif de la diversité 974
 * API : https://api.dicebear.com/9.x/avataaars/svg
 */

export interface AvatarConfig {
  skinColor:    string
  top:          string    // coiffure
  hairColor:    string
  eyes:         string
  eyebrow:      string
  mouth:        string
  clothes:      string
  clothesColor: string
  accessories:  string
  facialHair:   string
}

// ── Palette peaux — représentative de La Réunion ──────────────────
export const SKIN_COLORS = [
  { id: 'fae3d0', label: 'Très clair'   },
  { id: 'f8d25c', label: 'Beige doré'  },
  { id: 'fd9841', label: 'Hâlé'        },
  { id: 'edb98a', label: 'Caramel'     },
  { id: 'd08b5b', label: 'Brun chaud'  },
  { id: 'ae5d29', label: 'Chocolat'    },
  { id: '614335', label: 'Ébène'       },
]

// ── Coiffures ─────────────────────────────────────────────────────
export const HAIR_STYLES = [
  { id: 'bigHair',            label: 'Afro'         },
  { id: 'dreads01',           label: 'Locs'         },
  { id: 'curly',              label: 'Bouclé'       },
  { id: 'frizzle',            label: 'Frisé'        },
  { id: 'straight01',         label: 'Lisse court'  },
  { id: 'longButNotTooLong',  label: 'Mi-long'      },
  { id: 'bob',                label: 'Bob'          },
  { id: 'bun',                label: 'Chignon'      },
  { id: 'shortCurly',         label: 'Court bouclé' },
  { id: 'hijab',              label: 'Hijab'        },
  { id: 'turban',             label: 'Turban'       },
  { id: 'hat',                label: 'Chapeau'      },
]

// ── Couleurs de cheveux ───────────────────────────────────────────
export const HAIR_COLORS = [
  { id: '2c1b18', label: 'Noir'        },
  { id: '724133', label: 'Brun foncé'  },
  { id: 'b58143', label: 'Brun'        },
  { id: 'a55728', label: 'Auburn'      },
  { id: 'c1a36b', label: 'Blond'       },
  { id: 'f59797', label: 'Blond clair' },
  { id: 'b86060', label: 'Roux'        },
  { id: '929598', label: 'Gris'        },
]

// ── Yeux ──────────────────────────────────────────────────────────
export const EYES_STYLES = [
  { id: 'happy',     label: 'Joyeux'    },
  { id: 'default',   label: 'Naturel'   },
  { id: 'wink',      label: 'Clin d\'œil' },
  { id: 'surprised', label: 'Surpris'   },
  { id: 'squint',    label: 'Plissé'    },
  { id: 'hearts',    label: 'Amoureux'  },
]

// ── Sourcils ─────────────────────────────────────────────────────
export const EYEBROW_STYLES = [
  { id: 'default',         label: 'Naturel'  },
  { id: 'raisedExcited',   label: 'Haussés'  },
  { id: 'angryNatural',    label: 'Froncement' },
  { id: 'sadConcerned',    label: 'Triste'   },
]

// ── Bouche ────────────────────────────────────────────────────────
export const MOUTH_STYLES = [
  { id: 'smile',    label: 'Sourire'  },
  { id: 'default',  label: 'Neutre'   },
  { id: 'twinkle',  label: 'Brillant' },
  { id: 'tongue',   label: 'Langue'   },
  { id: 'serious',  label: 'Sérieux'  },
]

// ── Tenues ────────────────────────────────────────────────────────
export const CLOTHES_STYLES = [
  { id: 'blazerAndShirt',  label: 'Costume'     },
  { id: 'hoodie',          label: 'Hoodie'      },
  { id: 'blazerAndSweater',label: 'Blazer'      },
  { id: 'shirtCrewNeck',   label: 'T-shirt'     },
  { id: 'overall',         label: 'Salopette'   },
  { id: 'collarAndSweater',label: 'Col roulé'   },
]

// ── Couleurs de tenue ─────────────────────────────────────────────
export const CLOTHES_COLORS = [
  { id: '3c4f5c', label: 'Marine'     },
  { id: '65c9ff', label: 'Bleu ciel'  },
  { id: 'ff488e', label: 'Rose'       },
  { id: '929598', label: 'Gris'       },
  { id: 'a7ffc4', label: 'Vert mint'  },
  { id: 'ffdeb5', label: 'Crème'      },
]

// ── Accessoires ───────────────────────────────────────────────────
export const ACCESSORIES = [
  { id: 'blank',          label: 'Aucun'          },
  { id: 'prescription02', label: 'Lunettes rondes' },
  { id: 'sunglasses',     label: 'Lunettes soleil' },
  { id: 'wayfarers',      label: 'Wayfarer'        },
  { id: 'kurt',           label: 'Petites lunettes'},
]

// ── Avatar par défaut ─────────────────────────────────────────────
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinColor:    'edb98a',
  top:          'shortCurly',
  hairColor:    '2c1b18',
  eyes:         'happy',
  eyebrow:      'default',
  mouth:        'smile',
  clothes:      'blazerAndShirt',
  clothesColor: '3c4f5c',
  accessories:  'blank',
  facialHair:   'blank',
}

// ── Générer une config aléatoire ──────────────────────────────────
export function randomAvatarConfig(): AvatarConfig {
  const pick = <T>(arr: { id: string }[]) => arr[Math.floor(Math.random() * arr.length)].id as T
  return {
    skinColor:    pick(SKIN_COLORS),
    top:          pick(HAIR_STYLES),
    hairColor:    pick(HAIR_COLORS),
    eyes:         pick(EYES_STYLES),
    eyebrow:      pick(EYEBROW_STYLES),
    mouth:        pick(MOUTH_STYLES),
    clothes:      pick(CLOTHES_STYLES),
    clothesColor: pick(CLOTHES_COLORS),
    accessories:  pick(ACCESSORIES),
    facialHair:   'blank',
  }
}

// ── Génération SVG locale (npm @dicebear/core + @dicebear/collection) ──
// Aucun appel HTTP — génération 100% côté client, pas de 400/CORS possible
import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'

export function generateAvatarSvg(config: AvatarConfig): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const style = avataaars as any
    const avatar = createAvatar(style, {
      seed:          config.skinColor + config.top + config.eyes,
      skinColor:     [config.skinColor],
      top:           [config.top],
      hairColor:     [config.hairColor],
      eyes:          [config.eyes],
      eyebrows:      [config.eyebrow],      // ← 'eyebrows' (pluriel) dans DiceBear
      mouth:         [config.mouth],
      clothing:      [config.clothes],      // ← 'clothing' dans DiceBear (pas 'clothes')
      clothingColor: [config.clothesColor], // ← 'clothingColor' dans DiceBear
      accessories:   config.accessories === 'blank' ? [] : [config.accessories],
      facialHair:    config.facialHair   === 'blank' ? [] : [config.facialHair],
    })
    return avatar.toString()
  } catch {
    // Fallback minimal en cas d'option invalide
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createAvatar(avataaars as any, { seed: config.skinColor }).toString()
  }
}

// ── Personnage par domaine métier ────────────────────────────────
// On "évoque" le métier via tenue + couleur (DiceBear n'a pas de tenues
// métier dédiées). Le candidat peut tout personnaliser ensuite.
export const CHARACTER_GENDERS = [
  { id: 'femme', label: 'Femme',  top: 'longButNotTooLong' },
  { id: 'homme', label: 'Homme',  top: 'shortCurly'        },
  { id: 'autre', label: 'Autre',  top: 'curly'             },
]

export interface CharacterDomain {
  id: string
  label: string
  emoji: string
  clothes: string
  clothesColor: string
  accessories?: string
}

export const CHARACTER_DOMAINS: CharacterDomain[] = [
  { id: 'sante',          label: 'Santé & Social',        emoji: '🩺', clothes: 'shirtCrewNeck',    clothesColor: 'a7ffc4' },
  { id: 'btp',            label: 'BTP & Artisanat',       emoji: '👷', clothes: 'overall',          clothesColor: 'ffdeb5' },
  { id: 'tech',           label: 'Tech & Numérique',      emoji: '💻', clothes: 'hoodie',           clothesColor: '3c4f5c' },
  { id: 'commerce',       label: 'Commerce & Vente',      emoji: '🛍️', clothes: 'blazerAndShirt',   clothesColor: 'ff488e' },
  { id: 'restauration',   label: 'Hôtellerie & Resto',    emoji: '🍽️', clothes: 'collarAndSweater', clothesColor: 'ffdeb5' },
  { id: 'tourisme',       label: 'Tourisme & Loisirs',    emoji: '🌴', clothes: 'shirtCrewNeck',    clothesColor: '65c9ff' },
  { id: 'transport',      label: 'Transport & Logistique',emoji: '🚚', clothes: 'hoodie',           clothesColor: '929598' },
  { id: 'education',      label: 'Éducation & Formation',  emoji: '📚', clothes: 'blazerAndSweater', clothesColor: '3c4f5c' },
  { id: 'administration', label: 'Administration & Gestion',emoji: '📊', clothes: 'blazerAndShirt',  clothesColor: '3c4f5c' },
  { id: 'agriculture',    label: 'Agriculture & Environnement', emoji: '🌱', clothes: 'overall',     clothesColor: 'a7ffc4' },
  { id: 'autre',          label: 'Autre domaine',         emoji: '✨', clothes: 'shirtCrewNeck',    clothesColor: '65c9ff' },
]

/** Construit une config avatar "personnage" à partir d'un domaine + genre */
export function buildCharacterConfig(domainId: string, genderId: string): AvatarConfig {
  const domain = CHARACTER_DOMAINS.find(d => d.id === domainId)
  const gender = CHARACTER_GENDERS.find(g => g.id === genderId)
  return {
    ...DEFAULT_AVATAR_CONFIG,
    top:          gender?.top ?? DEFAULT_AVATAR_CONFIG.top,
    clothes:      domain?.clothes ?? DEFAULT_AVATAR_CONFIG.clothes,
    clothesColor: domain?.clothesColor ?? DEFAULT_AVATAR_CONFIG.clothesColor,
    accessories:  domain?.accessories ?? 'blank',
  }
}

/** Rétrocompatibilité — utilisé dans resolveAvatarSrc */
export function buildAvatarUrl(_config: AvatarConfig): string {
  // Conservé pour compatibilité, mais generateAvatarSvg est préféré
  return ''
}

/** Résout la source de l'avatar : DiceBear > photo > null (initiales) */
export function resolveAvatarSrc(
  avatarConfig: AvatarConfig | Record<string, string> | null | undefined,
  avatarUrl: string | null | undefined
): string | null {
  if (avatarConfig && Object.keys(avatarConfig).length > 0) {
    return buildAvatarUrl(avatarConfig as unknown as AvatarConfig)
  }
  return avatarUrl ?? null
}
