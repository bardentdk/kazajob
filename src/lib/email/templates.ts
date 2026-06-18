/**
 * KAZAJOB — Templates email HTML
 * Architecture 100% table-based (compatible Gmail, Outlook, Apple Mail)
 * DA fidèle : orange #FF6B35, violet #6D3BEB, cream #FFF7EE, ink #1A1410
 */

// ── Palette ────────────────────────────────────────────────────────
const C = {
  orange:     '#FF6B35',
  orangeSoft: '#FFE0CF',
  violet:     '#6D3BEB',
  violetSoft: '#E5DCFF',
  ink:        '#1A1410',
  cream:      '#FFF7EE',
  cream2:     '#FBEFE0',
  paper:      '#FDF6EC',
  mute:       '#6B5A4A',
  line:       '#E8DDC9',
  green:      '#19A974',
  greenSoft:  '#D6F0E0',
  yellow:     '#FFC93C',
  yellowSoft: '#FFF1C2',
  bg:         '#F2E4D0',
}

// ── Helpers ────────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ── Logo (PNG hébergé — SVG non fiable en email) ───────────────────
const LOGO_URL = 'https://kazajob.re/kazajob.png'

// ── Shell commun (wrapper email) ───────────────────────────────────
function shell(headerAccent: string, body: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Kazajob</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bg};">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Carte principale -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="max-width:580px;background-color:${C.cream};border:2px solid ${C.ink};border-radius:16px;overflow:hidden;">

        <!-- Barre d'accent -->
        <tr>
          <td style="height:6px;background-color:${headerAccent};font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
        </tr>

        <!-- HEADER (logo réel sur fond clair, façon Brevo) -->
        <tr>
          <td style="background-color:${C.cream};padding:26px 32px 22px;border-bottom:1px solid ${C.line};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <a href="https://kazajob.re" style="text-decoration:none;">
                    <img src="${LOGO_URL}" alt="Kazajob" height="30"
                      style="display:block;border:0;outline:none;text-decoration:none;height:30px;width:auto;">
                  </a>
                </td>
                <td style="vertical-align:middle;text-align:right;">
                  <span style="font-size:11px;font-weight:700;color:${C.mute};letter-spacing:0.06em;text-transform:uppercase;font-family:Arial,sans-serif;">La Réunion · 974</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:0;">
            ${body}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="border-top:1px solid ${C.line};padding:24px 32px;background-color:${C.cream2};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="text-align:center;">
                  <img src="${LOGO_URL}" alt="Kazajob" height="22"
                    style="display:inline-block;border:0;outline:none;text-decoration:none;height:22px;width:auto;margin-bottom:10px;">
                  <p style="margin:0;font-size:11px;color:${C.mute};line-height:1.7;font-family:Arial,sans-serif;">
                    Saint-Denis, La Réunion 974 &nbsp;·&nbsp;
                    <a href="https://kazajob.re" style="color:${C.orange};text-decoration:none;font-weight:700;">kazajob.re</a><br>
                    Cet email est automatique, merci de ne pas y répondre directement.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <!-- Mentions sous la carte -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
        <tr>
          <td style="padding:16px 12px 0;text-align:center;">
            <p style="margin:0;font-size:10px;color:${C.mute};opacity:0.7;line-height:1.6;font-family:Arial,sans-serif;">
              © ${year} Kazajob — La plateforme d'emploi de La Réunion.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`
}

// ── Bouton CTA ─────────────────────────────────────────────────────
function ctaButton(label: string, href: string, bg = C.orange, color = C.ink): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:${bg};border:2px solid ${C.ink};border-radius:10px;
          box-shadow:4px 4px 0 ${C.ink};">
          <a href="${href}"
            style="display:block;padding:14px 32px;font-size:15px;font-weight:800;
            color:${color};text-decoration:none;letter-spacing:-0.01em;white-space:nowrap;
            font-family:Arial,sans-serif;">
            ${label} &rarr;
          </a>
        </td>
      </tr>
    </table>`
}

// ── Ligne séparateur ───────────────────────────────────────────────
function divider(): string {
  return `<tr><td style="padding:8px 32px;"><div style="height:1px;background-color:${C.line};"></div></td></tr>`
}

// ── Bloc "étape" pour welcome ──────────────────────────────────────
function stepBlock(num: string, title: string, desc: string, bg: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:${bg};border:1.5px solid ${C.ink};border-radius:12px;margin-bottom:10px;">
      <tr>
        <td width="50" style="padding:16px 12px 16px 16px;vertical-align:top;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:${C.ink};border-radius:50%;width:28px;height:28px;
                text-align:center;vertical-align:middle;">
                <span style="font-size:13px;font-weight:900;color:${C.cream};font-family:Arial,sans-serif;
                  line-height:28px;display:block;">${num}</span>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:16px 16px 16px 0;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:13px;font-weight:800;color:${C.ink};font-family:Arial,sans-serif;">${title}</p>
          <p style="margin:0;font-size:12px;color:${C.mute};line-height:1.5;font-family:Arial,sans-serif;">${desc}</p>
        </td>
      </tr>
    </table>`
}

// ── Chip / Badge ───────────────────────────────────────────────────
function chip(text: string, bg: string, color = C.ink): string {
  return `<span style="display:inline-block;background-color:${bg};border:1.5px solid ${C.ink};
    border-radius:999px;padding:4px 14px;font-size:12px;font-weight:700;color:${color};
    letter-spacing:0.02em;font-family:Arial,sans-serif;">${text}</span>`
}

// ── Ligne de détail (label + valeur) ──────────────────────────────
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid ${C.line};width:40%;
        font-size:11px;font-weight:700;color:${C.mute};text-transform:uppercase;
        letter-spacing:0.07em;font-family:Arial,sans-serif;">${label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid ${C.line};
        font-size:14px;font-weight:700;color:${C.ink};font-family:Arial,sans-serif;">${value}</td>
    </tr>`
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 1 — Invitation entretien
// ══════════════════════════════════════════════════════════════════

interface InterviewEmailData {
  candidateName: string
  recruiterName:  string
  companyName:   string
  jobTitle:      string
  scheduledAt:   Date
  durationMin:   number
  type:          'video' | 'phone' | 'onsite'
  visioLink?:    string | null
  location?:     string | null
  notes?:        string | null
  isReminder?:   boolean
}

const TYPE_LABEL: Record<string, string> = {
  video:  'Visioconférence',
  phone:  'Entretien téléphonique',
  onsite: 'Entretien présentiel',
}

const TYPE_COLOR: Record<string, string> = {
  video:  C.violetSoft,
  phone:  C.yellowSoft,
  onsite: C.greenSoft,
}

export function interviewInviteEmail(
  data: InterviewEmailData,
  recipient: 'candidate' | 'recruiter'
): { subject: string; html: string } {
  const isCandidate = recipient === 'candidate'

  const subject = data.isReminder
    ? `Rappel — Entretien demain : ${data.jobTitle} chez ${data.companyName}`
    : isCandidate
      ? `Entretien planifié — ${data.jobTitle} chez ${data.companyName}`
      : `Entretien confirmé — ${data.candidateName} pour ${data.jobTitle}`

  const headerBg = data.isReminder ? C.yellow : C.orange

  const visioBlock = data.visioLink ? `
    <tr>
      <td style="padding:0 32px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background-color:${C.violetSoft};border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:${C.mute};
                text-transform:uppercase;letter-spacing:0.07em;font-family:Arial,sans-serif;">
                Lien de connexion
              </p>
              ${ctaButton('Rejoindre la visioconférence', data.visioLink, C.violet, '#FFFFFF')}
              <p style="margin:10px 0 0;font-size:10px;color:${C.mute};word-break:break-all;font-family:Arial,sans-serif;">
                ${data.visioLink}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''

  const locationBlock = data.location ? `
    <tr>
      <td style="padding:0 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background-color:${C.cream2};border:1.5px solid ${C.line};border-radius:10px;">
          <tr>
            <td style="padding:12px 16px;">
              <span style="font-size:12px;font-weight:700;color:${C.mute};font-family:Arial,sans-serif;">Lieu :</span>
              <span style="font-size:13px;font-weight:600;color:${C.ink};margin-left:6px;font-family:Arial,sans-serif;">${data.location}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''

  const notesBlock = data.notes ? `
    <tr>
      <td style="padding:0 32px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background-color:${C.paper};border:1.5px dashed ${C.line};border-radius:10px;">
          <tr>
            <td style="padding:14px 16px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${C.mute};
                text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">
                Notes du recruteur
              </p>
              <p style="margin:0;font-size:13px;color:${C.ink};line-height:1.55;font-family:Arial,sans-serif;">${data.notes}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''

  const ctaHref = isCandidate
    ? 'https://kazajob.re/candidate/agenda'
    : 'https://kazajob.re/recruiter/agenda'

  const body = `
    <!-- Badge type -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip(TYPE_LABEL[data.type] + (data.isReminder ? ' — Rappel J-1' : ''), TYPE_COLOR[data.type])}
        </td>
      </tr>

      <!-- Titre -->
      <tr>
        <td style="padding:0 32px 8px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.1;font-family:Arial,sans-serif;">
            ${data.isReminder ? 'Votre entretien<br>est demain !' : 'Entretien<br>planifié !'}
          </h1>
        </td>
      </tr>

      <!-- Intro -->
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            ${isCandidate
              ? `Bonjour <strong style="color:${C.ink};">${data.candidateName}</strong>,<br><br>
                 <strong style="color:${C.ink};">${data.recruiterName}</strong> de
                 <strong style="color:${C.orange};">${data.companyName}</strong>
                 a planifié un entretien avec vous pour le poste de
                 <strong style="color:${C.ink};">${data.jobTitle}</strong>.`
              : `Bonjour <strong style="color:${C.ink};">${data.recruiterName}</strong>,<br><br>
                 Votre entretien avec <strong style="color:${C.orange};">${data.candidateName}</strong>
                 pour le poste <strong style="color:${C.ink};">${data.jobTitle}</strong> est confirmé.`}
          </p>
        </td>
      </tr>

      <!-- Carte détails -->
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Date', formatDate(data.scheduledAt))}
            ${detailRow('Heure', formatTime(data.scheduledAt))}
            ${detailRow('Durée', `${data.durationMin} minutes`)}
            ${detailRow('Poste', data.jobTitle)}
            ${detailRow('Entreprise', data.companyName)}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>

      ${visioBlock}
      ${locationBlock}
      ${notesBlock}

      <!-- CTA principal -->
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${ctaButton('Voir dans Kazajob', ctaHref)}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(headerBg, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 2 — Candidature retirée (pour le recruteur)
// ══════════════════════════════════════════════════════════════════

export function applicationWithdrawnEmail(data: {
  recruiterName: string
  candidateName: string
  jobTitle:      string
}): { subject: string; html: string } {
  const subject = `Candidature retirée — ${data.candidateName} pour ${data.jobTitle}`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip('Candidature retirée', C.orangeSoft)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;font-family:Arial,sans-serif;">
            Un candidat<br>s&apos;est retiré.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.recruiterName}</strong>,<br><br>
            <strong style="color:${C.orange};">${data.candidateName}</strong>
            a décidé de retirer sa candidature pour le poste de
            <strong style="color:${C.ink};">${data.jobTitle}</strong>.<br><br>
            D&apos;autres candidats ont postulé — explorez le pipeline pour trouver votre perle rare.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:${C.cream2};border:1.5px solid ${C.line};border-radius:10px;">
            ${detailRow('Candidat', data.candidateName)}
            ${detailRow('Poste', data.jobTitle)}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${ctaButton('Voir mes candidatures', 'https://kazajob.re/recruiter/applications')}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(C.orange, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 3 — Changement de statut candidature (pour le candidat)
// ══════════════════════════════════════════════════════════════════

export type ApplicationStatus = 'viewed' | 'interview' | 'offer' | 'hired' | 'rejected'

const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string; headline: string; msg: string; bg: string; chipBg: string
}> = {
  viewed: {
    label:    'CV consulté',
    headline: 'Votre CV a été consulté !',
    msg:      'Bonne nouvelle — un recruteur a regardé votre candidature. Restez disponible, la suite arrive bientôt.',
    bg:       C.orange,
    chipBg:   C.yellowSoft,
  },
  interview: {
    label:    'Entretien planifié',
    headline: 'Entretien planifié !',
    msg:      'Félicitations ! Votre profil a retenu l&apos;attention. Rendez-vous dans votre agenda pour les détails.',
    bg:       C.violet,
    chipBg:   C.violetSoft,
  },
  offer: {
    label:    'Offre reçue',
    headline: 'Vous avez une offre !',
    msg:      'Incroyable — vous avez reçu une offre d&apos;emploi. Connectez-vous pour consulter les détails et répondre.',
    bg:       C.green,
    chipBg:   C.greenSoft,
  },
  hired: {
    label:    'Embauche confirmée',
    headline: 'Félicitations, vous êtes embauché(e) !',
    msg:      'C&apos;est officiel ! Toute l&apos;équipe Kazajob vous félicite. Bonne continuation dans ce nouveau chapitre.',
    bg:       C.green,
    chipBg:   C.greenSoft,
  },
  rejected: {
    label:    'Candidature non retenue',
    headline: 'Ne lâchez rien.',
    msg:      'Votre candidature n&apos;a pas été retenue cette fois-ci. D&apos;autres opportunités vous attendent sur Kazajob 974.',
    bg:       '#6B5A4A',
    chipBg:   C.cream2,
  },
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 4 — Email de bienvenue
// ══════════════════════════════════════════════════════════════════

export function welcomeEmail(data: {
  fullName: string
  role: 'candidate' | 'recruiter'
}): { subject: string; html: string } {
  const isCandidate = data.role === 'candidate'
  const subject = `Bienvenue sur Kazajob 974, ${data.fullName.split(' ')[0]} !`
  const headerBg = isCandidate ? C.orange : C.violet
  const dashboardUrl = isCandidate
    ? 'https://kazajob.re/candidate/dashboard'
    : 'https://kazajob.re/recruiter/company-setup'

  const stepsCandidate = `
    ${stepBlock('1', 'Complète ton profil', 'Photo, CV, compétences — un profil complet est vu 3× plus.', C.orangeSoft)}
    ${stepBlock('2', 'Explore les offres', 'Des centaines d\'offres locales, filtrées pour toi.', C.yellowSoft)}
    ${stepBlock('3', 'Postule en 1 clic', 'Lettre de motivation générée par KazaIA en 5 secondes.', C.violetSoft)}`

  const stepsRecruiter = `
    ${stepBlock('1', 'Configurez votre entreprise', 'Logo, raison sociale, équipe — 3 minutes chrono.', C.violetSoft)}
    ${stepBlock('2', 'Publiez votre première offre', 'Diffusion sur Kazajob et accès au vivier de talents 974.', C.orangeSoft)}
    ${stepBlock('3', 'Gérez votre pipeline', 'KazaScore, entretiens, analytics — tout en un.', C.greenSoft)}`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:28px 32px 16px;">
          <h1 style="margin:0;font-size:30px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.1;font-family:Arial,sans-serif;">
            Bienvenue<br>sur Kazajob !
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 24px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.fullName}</strong>,<br><br>
            ${isCandidate
              ? 'Votre compte candidat est créé. Kazajob connecte les talents réunionnais aux meilleures opportunités locales — avec un peu d\'IA et beaucoup de soleil.'
              : 'Votre compte recruteur est créé. Commencez par configurer votre espace entreprise pour publier vos offres et accéder au vivier de talents 974.'}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 8px;">
          <p style="margin:0;font-size:12px;font-weight:700;color:${C.mute};text-transform:uppercase;
            letter-spacing:0.07em;font-family:Arial,sans-serif;">Par où commencer ?</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 24px;">
          ${isCandidate ? stepsCandidate : stepsRecruiter}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;text-align:center;">
          ${ctaButton(
            isCandidate ? 'Accéder à mon espace' : 'Configurer mon entreprise',
            dashboardUrl,
            isCandidate ? C.orange : C.violet,
            isCandidate ? C.ink : '#FFFFFF'
          )}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(headerBg, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 5 — Nouvelle candidature (pour le recruteur)
// ══════════════════════════════════════════════════════════════════

export function newApplicationEmail(data: {
  recruiterName:  string
  candidateName:  string
  candidateEmail: string
  jobTitle:       string
  companyName:    string
  applicationId:  string
  hasCoverLetter: boolean
}): { subject: string; html: string } {
  const subject = `Nouvelle candidature — ${data.candidateName} pour ${data.jobTitle}`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip('Nouvelle candidature', C.greenSoft)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            Vous avez un<br>nouveau candidat !
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.recruiterName}</strong>,<br><br>
            <strong style="color:${C.orange};">${data.candidateName}</strong> vient de postuler
            pour le poste de <strong style="color:${C.ink};">${data.jobTitle}</strong>
            ${data.hasCoverLetter ? 'avec une lettre de motivation.' : 'sans lettre de motivation.'}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Candidat', data.candidateName)}
            ${detailRow('Email', data.candidateEmail)}
            ${detailRow('Poste', data.jobTitle)}
            ${detailRow('Lettre de motivation', data.hasCoverLetter ? 'Oui' : 'Non')}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${ctaButton('Voir la candidature', `https://kazajob.re/recruiter/applications`)}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(C.green, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 6 — Alerte emploi (digest de nouvelles offres)
// ══════════════════════════════════════════════════════════════════

export interface JobAlertItem {
  id:        string
  title:     string
  company:   string
  location:  string
  job_type:  string
  salary:    string | null
}

export function jobAlertEmail(data: {
  candidateName: string
  jobs:          JobAlertItem[]
  frequency:     'instant' | 'daily' | 'weekly'
}): { subject: string; html: string } {
  const count   = data.jobs.length
  const period  = data.frequency === 'weekly' ? 'cette semaine' : 'aujourd\'hui'
  const subject = `${count} nouvelle${count > 1 ? 's' : ''} offre${count > 1 ? 's' : ''} pour vous — Kazajob 974`

  const jobRows = data.jobs.slice(0, 5).map(job => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:white;border:1.5px solid ${C.line};border-radius:10px;margin-bottom:8px;">
      <tr>
        <td style="padding:14px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:40px;height:40px;background-color:${C.orangeSoft};border:1.5px solid ${C.ink};
                border-radius:8px;text-align:center;vertical-align:middle;font-size:12px;font-weight:900;
                color:${C.ink};font-family:Arial,sans-serif;">${job.company.slice(0,2).toUpperCase()}</td>
              <td style="padding-left:12px;">
                <p style="margin:0 0 2px;font-size:13px;font-weight:800;color:${C.ink};font-family:Arial,sans-serif;">${job.title}</p>
                <p style="margin:0;font-size:11px;color:${C.mute};font-family:Arial,sans-serif;">
                  ${job.company} &middot; ${job.location} &middot; ${job.job_type}
                  ${job.salary ? ` &middot; ${job.salary}` : ''}
                </p>
              </td>
              <td style="padding-left:8px;text-align:right;white-space:nowrap;">
                <a href="https://kazajob.re/candidate/jobs/${job.id}"
                  style="display:inline-block;background-color:${C.orangeSoft};border:1.5px solid ${C.ink};
                  border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;color:${C.ink};
                  text-decoration:none;font-family:Arial,sans-serif;">Voir &rarr;</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`).join('')

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip(`${count} nouvelle${count > 1 ? 's' : ''} offre${count > 1 ? 's' : ''} ${period}`, C.violetSoft, C.violet)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            Des offres fraîches<br>rien que pour vous.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.candidateName}</strong>,<br><br>
            Voici les nouvelles offres publiées ${period} sur Kazajob 974.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          ${jobRows}
          ${count > 5 ? `<p style="text-align:center;font-size:12px;color:${C.mute};margin:8px 0 0;font-family:Arial,sans-serif;">
            + ${count - 5} autres offres disponibles sur Kazajob</p>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${ctaButton('Voir toutes les offres', 'https://kazajob.re/candidate/jobs', C.violet, '#FFFFFF')}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 16px;">
          <p style="margin:0;font-size:11px;color:${C.mute};text-align:center;font-family:Arial,sans-serif;">
            Vous recevez ces alertes car vous les avez activées dans vos
            <a href="https://kazajob.re/candidate/settings" style="color:${C.orange};text-decoration:none;">paramètres</a>.
            Pour les désactiver, rendez-vous dans Paramètres → Alertes email.
          </p>
        </td>
      </tr>
    </table>`

  return { subject, html: shell(C.violet, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 7 — Nouveau message
// ══════════════════════════════════════════════════════════════════

export function newMessageEmail(data: {
  recipientName: string
  senderName:    string
  messagePreview: string
  jobTitle?:     string
  role:          'candidate' | 'recruiter'
}): { subject: string; html: string } {
  const subject = `Nouveau message de ${data.senderName} — Kazajob`
  const link = data.role === 'candidate'
    ? 'https://kazajob.re/candidate/messages'
    : 'https://kazajob.re/recruiter/messages'

  const preview = data.messagePreview.length > 120
    ? data.messagePreview.slice(0, 120) + '…'
    : data.messagePreview

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip('Nouveau message', C.violetSoft)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            ${data.senderName}<br>vous a écrit.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.recipientName}</strong>,
            ${data.jobTitle ? `<br>concernant le poste <strong style="color:${C.orange};">${data.jobTitle}</strong>` : ''}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:${C.cream2};border:1.5px dashed ${C.line};border-radius:10px;">
            <tr>
              <td style="padding:16px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${C.mute};
                  text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">
                  Aperçu du message
                </p>
                <p style="margin:0;font-size:14px;color:${C.ink};line-height:1.6;
                  font-style:italic;font-family:Arial,sans-serif;">&ldquo;${preview}&rdquo;</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${ctaButton('Répondre dans Kazajob', link)}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(C.orange, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 8 — Demande de rejoindre une équipe (pour l'owner)
// ══════════════════════════════════════════════════════════════════

export function joinRequestEmail(data: {
  ownerName:      string
  companyName:    string
  requesterName:  string
  requesterEmail: string
  message?:       string | null
}): { subject: string; html: string } {
  const subject = `${data.requesterName} souhaite rejoindre ${data.companyName} sur Kazajob`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip("Demande d'adhésion", C.violetSoft, C.violet)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:24px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            Quelqu&rsquo;un veut<br>rejoindre votre équipe.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.ownerName}</strong>,<br><br>
            <strong style="color:${C.orange};">${data.requesterName}</strong> souhaite rejoindre
            l&apos;espace recruteur de <strong style="color:${C.ink};">${data.companyName}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Demandeur', data.requesterName)}
            ${detailRow('Email', data.requesterEmail)}
            ${data.message ? detailRow('Message', data.message) : ''}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${ctaButton("Gérer l'équipe", 'https://kazajob.re/recruiter/company/team', C.violet, '#FFFFFF')}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(C.violet, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 9 — Réponse à une demande d'adhésion
// ══════════════════════════════════════════════════════════════════

export function joinResponseEmail(data: {
  recruiterName: string
  companyName:   string
  approved:      boolean
}): { subject: string; html: string } {
  const subject = data.approved
    ? `Vous avez rejoint ${data.companyName} sur Kazajob !`
    : `Votre demande pour ${data.companyName} n'a pas été acceptée`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip(data.approved ? 'Demande acceptée' : 'Demande refusée',
            data.approved ? C.greenSoft : C.cream2,
            data.approved ? C.green : C.mute)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            ${data.approved
              ? `Bienvenue dans<br>l&rsquo;équipe !`
              : `Votre demande<br>n&rsquo;a pas abouti.`}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.recruiterName}</strong>,<br><br>
            ${data.approved
              ? `Votre demande pour rejoindre <strong style="color:${C.orange};">${data.companyName}</strong> a été <strong>acceptée</strong>. Vous avez maintenant accès à l&apos;espace recruteur de l&apos;entreprise.`
              : `Votre demande pour rejoindre <strong style="color:${C.orange};">${data.companyName}</strong> n&apos;a pas été acceptée. Vous pouvez contacter directement l&apos;administrateur ou chercher une autre entreprise.`}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${data.approved
            ? ctaButton("Accéder à l'espace entreprise", 'https://kazajob.re/recruiter/company', C.green, '#FFFFFF')
            : ctaButton("Chercher une entreprise", 'https://kazajob.re/recruiter/company-setup')}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(data.approved ? C.green : '#6B5A4A', body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 10 — Invitation à rejoindre une équipe (token)
// ══════════════════════════════════════════════════════════════════

export function teamInvitationEmail(data: {
  inviterName: string
  companyName: string
  role:        'member' | 'admin'
  acceptUrl:   string
}): { subject: string; html: string } {
  const subject = `${data.inviterName} vous invite à rejoindre ${data.companyName} sur Kazajob`
  const roleLabel = data.role === 'admin' ? 'Administrateur' : 'Recruteur'

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip('Invitation équipe', C.violetSoft, C.violet)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            Rejoignez<br>${data.companyName}.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            <strong style="color:${C.orange};">${data.inviterName}</strong> vous invite à rejoindre
            l&apos;espace recruteur de <strong style="color:${C.ink};">${data.companyName}</strong>
            sur Kazajob, en tant que <strong style="color:${C.ink};">${roleLabel}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Entreprise', data.companyName)}
            ${detailRow('Rôle', roleLabel)}
            ${detailRow('Invité par', data.inviterName)}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 16px;text-align:center;">
          ${ctaButton("Accepter l'invitation", data.acceptUrl, C.violet, '#FFFFFF')}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <p style="margin:0;font-size:11px;color:${C.mute};text-align:center;line-height:1.6;font-family:Arial,sans-serif;">
            Ce lien d&apos;invitation expire dans 7 jours. Si vous n&apos;avez pas de compte recruteur,
            vous pourrez en créer un avant d&apos;accepter.
          </p>
        </td>
      </tr>
    </table>`

  return { subject, html: shell(C.violet, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 11 — Relance fin d'essai (J-15 / J-7 / J-3 / J0)
// ══════════════════════════════════════════════════════════════════

export function trialReminderEmail(data: {
  companyName: string
  ownerName:   string
  planName:    string
  priceEur:    string      // ex "179 €"
  daysLeft:    number      // palier : 15 | 7 | 3 | 0
  trialEndsAt: Date
}): { subject: string; html: string } {
  const isToday = data.daysLeft <= 0
  const accent  = isToday ? C.orange : data.daysLeft <= 3 ? C.yellow : C.violet
  const chipBg  = isToday ? C.orangeSoft : data.daysLeft <= 3 ? C.yellowSoft : C.violetSoft

  const chipLabel = isToday
    ? "Dernier jour d'essai"
    : `Essai — plus que ${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''}`

  const subject = isToday
    ? `Votre essai Kazajob se termine aujourd'hui — facturation à venir`
    : `Plus que ${data.daysLeft} jours d'essai Kazajob — préparez la suite`

  const headline = isToday
    ? `Votre essai<br>se termine aujourd&rsquo;hui.`
    : `Il vous reste<br>${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''} d&rsquo;essai.`

  const intro = isToday
    ? `Votre période d&apos;essai du forfait <strong style="color:${C.ink};">${data.planName}</strong> prend fin aujourd&apos;hui. Sauf annulation, votre moyen de paiement sera débité de <strong style="color:${C.orange};">${data.priceEur}/mois</strong> et votre abonnement continuera sans interruption.`
    : `Votre essai gratuit du forfait <strong style="color:${C.ink};">${data.planName}</strong> se termine bientôt. À la fin de l&apos;essai, votre abonnement passera automatiquement à <strong style="color:${C.orange};">${data.priceEur}/mois</strong>. Aucune action n&apos;est requise pour continuer.`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip(chipLabel, chipBg, isToday ? C.ink : C.violet)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            ${headline}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.ownerName}</strong>,<br><br>
            ${intro}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Entreprise', data.companyName)}
            ${detailRow('Forfait', data.planName)}
            ${detailRow('Tarif', `${data.priceEur} / mois`)}
            ${detailRow("Fin d'essai", formatDate(data.trialEndsAt))}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 16px;text-align:center;">
          ${ctaButton('Gérer mon abonnement', 'https://kazajob.re/recruiter/company', accent, isToday ? C.ink : '#FFFFFF')}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <p style="margin:0;font-size:11px;color:${C.mute};text-align:center;line-height:1.6;font-family:Arial,sans-serif;">
            Vous pouvez modifier votre forfait ou résilier à tout moment depuis votre espace entreprise,
            sans frais avant la fin de l&apos;essai.
          </p>
        </td>
      </tr>
    </table>`

  return { subject, html: shell(accent, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 12 — Signalement de bug (vers l'admin)
// ══════════════════════════════════════════════════════════════════

export function bugReportEmail(data: {
  reporterName:  string
  reporterEmail: string
  reporterRole:  string
  page:          string
  message:       string
  severity:      'normal' | 'critical'
  attachmentUrl?: string | null
}): { subject: string; html: string } {
  const critical = data.severity === 'critical'
  const accent = critical ? C.orange : C.violet
  const roleLabel = data.reporterRole === 'recruiter' ? 'Recruteur' : data.reporterRole === 'admin' ? 'Admin' : 'Candidat'

  const subject = `${critical ? '🔴 [BLOQUANT] ' : ''}Bug signalé — ${data.page}`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip(critical ? 'Défaut bloquant' : 'Signalement de bug', critical ? C.orangeSoft : C.violetSoft, critical ? C.ink : C.violet)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:24px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            Un bug vient<br>d&rsquo;être signalé.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Page', data.page)}
            ${detailRow('Gravité', critical ? 'Bloquant' : 'Normal')}
            ${detailRow('Par', `${data.reporterName} (${roleLabel})`)}
            ${detailRow('Email', data.reporterEmail)}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:${C.cream2};border:1.5px dashed ${C.line};border-radius:10px;">
            <tr>
              <td style="padding:16px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${C.mute};
                  text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">Message</p>
                <p style="margin:0;font-size:14px;color:${C.ink};line-height:1.6;white-space:pre-wrap;font-family:Arial,sans-serif;">${data.message}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${data.attachmentUrl ? `
      <tr>
        <td style="padding:0 32px 24px;text-align:center;">
          ${ctaButton('Voir la pièce jointe', data.attachmentUrl, accent, '#FFFFFF')}
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:0 32px 28px;text-align:center;">
          ${ctaButton('Ouvrir le suivi des bugs', 'https://kazajob.re/admin/bug-reports')}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(accent, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 13 — Prise de RDV / démo recruteur
// ══════════════════════════════════════════════════════════════════

export function demoBookingEmail(data: {
  recipient: 'prospect' | 'admin'
  name: string
  company?: string | null
  email: string
  phone?: string | null
  message?: string | null
  when?: Date | null
  durationMin?: number
}): { subject: string; html: string } {
  const isProspect = data.recipient === 'prospect'
  const whenStr = data.when ? `${formatDate(data.when)} à ${formatTime(data.when)}` : 'à convenir'

  const subject = isProspect
    ? `Votre rendez-vous Kazajob — ${whenStr}`
    : `Nouvelle demande de démo — ${data.name}${data.company ? ` (${data.company})` : ''}`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:24px 32px 16px;">${chip(isProspect ? 'Rendez-vous confirmé' : 'Nouvelle demande de démo', C.violetSoft, C.violet)}</td></tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            ${isProspect ? 'Votre rendez-vous<br>est confirmé !' : 'Un recruteur<br>veut une démo.'}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            ${isProspect
              ? `Bonjour <strong style="color:${C.ink};">${data.name}</strong>,<br><br>Merci pour votre intérêt ! Voici le récapitulatif de votre rendez-vous avec l'équipe Kazajob.`
              : `Une nouvelle demande de présentation vient d'arriver via la page démo.`}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Date', whenStr)}
            ${data.durationMin ? detailRow('Durée', `${data.durationMin} minutes`) : ''}
            ${!isProspect ? detailRow('Nom', data.name) : ''}
            ${!isProspect && data.company ? detailRow('Entreprise', data.company) : ''}
            ${!isProspect ? detailRow('Email', data.email) : ''}
            ${!isProspect && data.phone ? detailRow('Téléphone', data.phone) : ''}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      ${data.message ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.cream2};border:1.5px dashed ${C.line};border-radius:10px;">
            <tr><td style="padding:14px 16px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${C.mute};text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">Message</p>
              <p style="margin:0;font-size:13px;color:${C.ink};line-height:1.55;font-family:Arial,sans-serif;">${data.message}</p>
            </td></tr>
          </table>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${isProspect
            ? ctaButton('Découvrir Kazajob', 'https://kazajob.re', C.violet, '#FFFFFF')
            : ctaButton('Voir les demandes', 'https://kazajob.re/admin/demo', C.violet, '#FFFFFF')}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(C.violet, body) }
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE 14 — Candidature détaillée (→ recruteur / contact externe)
// ══════════════════════════════════════════════════════════════════

export interface ApplicationDetailData {
  kind: 'job' | 'training'
  recipientName: string
  title: string
  companyName: string
  candidate: {
    name: string; email: string; phone?: string | null; location?: string | null; bio?: string | null
    skills: string[]
    cvUrl?: string | null; linkedin?: string | null; github?: string | null; portfolio?: string | null; portfolioPdf?: string | null
  }
  coverLetter?: string | null
  prequal?: { label: string; value: string }[]
}

export function applicationDetailEmail(data: ApplicationDetailData): { subject: string; html: string } {
  const c = data.candidate
  const kindLabel = data.kind === 'training' ? 'formation' : 'offre'
  const subject = `Nouvelle candidature — ${c.name} pour « ${data.title} »`

  const linkBtn = (label: string, href: string) =>
    `<a href="${href}" target="_blank" style="display:inline-block;margin:0 6px 6px 0;background-color:${C.violetSoft};border:1.5px solid ${C.ink};border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;color:${C.violet};text-decoration:none;font-family:Arial,sans-serif;">${label}</a>`

  const links = [
    c.cvUrl && linkBtn('📄 CV', c.cvUrl),
    c.portfolioPdf && linkBtn('📎 Portfolio PDF', c.portfolioPdf),
    c.linkedin && linkBtn('LinkedIn', c.linkedin),
    c.github && linkBtn('GitHub', c.github),
    c.portfolio && linkBtn('Portfolio', c.portfolio),
  ].filter(Boolean).join('')

  const prequalRows = (data.prequal ?? []).filter((p) => p.value).map((p) => detailRow(p.label, p.value)).join('')

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:24px 32px 16px;">${chip('Nouvelle candidature', C.greenSoft, C.green)}</td></tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:24px;font-weight:900;color:${C.ink};letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            ${c.name} a postulé.
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 18px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.recipientName}</strong>,<br><br>
            Une nouvelle candidature vient d'arriver pour votre ${kindLabel} <strong style="color:${C.ink};">« ${data.title} »</strong>${data.companyName ? ` (${data.companyName})` : ''}.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Candidat', c.name)}
            ${detailRow('Email', c.email)}
            ${c.phone ? detailRow('Téléphone', c.phone) : ''}
            ${c.location ? detailRow('Localisation', c.location) : ''}
            ${c.skills.length ? detailRow('Compétences', c.skills.join(', ')) : ''}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      ${c.bio ? `<tr><td style="padding:0 32px 18px;"><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${C.mute};text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">Présentation</p><p style="margin:0;font-size:13px;color:${C.ink};line-height:1.55;font-family:Arial,sans-serif;">${c.bio}</p></td></tr>` : ''}
      ${links ? `<tr><td style="padding:0 32px 18px;"><p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${C.mute};text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">Pièces jointes &amp; liens</p>${links}</td></tr>` : ''}
      ${prequalRows ? `<tr><td style="padding:0 32px 18px;"><p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${C.mute};text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">Préqualification</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.cream2};border:1.5px solid ${C.line};border-radius:10px;overflow:hidden;">${prequalRows}<tr><td colspan="2" style="height:1px;"></td></tr></table></td></tr>` : ''}
      ${data.coverLetter ? `<tr><td style="padding:0 32px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.paper};border:1.5px dashed ${C.line};border-radius:10px;"><tr><td style="padding:14px 16px;"><p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${C.mute};text-transform:uppercase;letter-spacing:0.06em;font-family:Arial,sans-serif;">Lettre de motivation</p><p style="margin:0;font-size:13px;color:${C.ink};line-height:1.55;white-space:pre-wrap;font-family:Arial,sans-serif;">${data.coverLetter}</p></td></tr></table></td></tr>` : ''}
      <tr><td style="padding:0 32px 28px;text-align:center;">${ctaButton('Répondre au candidat', `mailto:${c.email}`, C.violet, '#FFFFFF')}</td></tr>
    </table>`

  return { subject, html: shell(C.green, body) }
}

export function applicationStatusEmail(data: {
  candidateName: string
  jobTitle:      string
  companyName:   string
  status:        ApplicationStatus
}): { subject: string; html: string } {
  const conf = STATUS_CONFIG[data.status]

  const subject = data.status === 'hired'
    ? `Kazajob — Félicitations ! Vous êtes embauché(e) chez ${data.companyName}`
    : `Kazajob — ${conf.label} : ${data.jobTitle} chez ${data.companyName}`

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 32px 16px;">
          ${chip(conf.label, conf.chipBg)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 12px;">
          <h1 style="margin:0;font-size:26px;font-weight:900;color:${C.ink};
            letter-spacing:-0.03em;line-height:1.15;font-family:Arial,sans-serif;">
            ${conf.headline}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 20px;">
          <p style="margin:0;font-size:14px;color:#2A2018;line-height:1.6;font-family:Arial,sans-serif;">
            Bonjour <strong style="color:${C.ink};">${data.candidateName}</strong>,<br><br>
            ${conf.msg}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:white;border:2px solid ${C.ink};border-radius:12px;overflow:hidden;">
            ${detailRow('Poste', data.jobTitle)}
            ${detailRow('Entreprise', data.companyName)}
            ${detailRow('Statut', conf.label)}
            <tr><td colspan="2" style="height:1px;"></td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 32px 28px;text-align:center;">
          ${ctaButton('Voir ma candidature', 'https://kazajob.re/candidate/applications')}
        </td>
      </tr>
    </table>`

  return { subject, html: shell(conf.bg, body) }
}
