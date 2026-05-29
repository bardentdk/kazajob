/**
 * KAZAJOB — Templates email HTML
 * Design cohérent avec la DA du site (orange, violet, cartoon)
 */

interface InterviewEmailData {
  candidateName: string
  recruiterName: string
  companyName: string
  jobTitle: string
  scheduledAt: Date
  durationMin: number
  type: 'video' | 'phone' | 'onsite'
  visioLink?: string | null
  location?: string | null
  notes?: string | null
  isReminder?: boolean
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const typeLabels = {
  video:   'Visioconférence',
  phone:   'Entretien téléphonique',
  onsite:  'Entretien présentiel',
}

const typeIcons = {
  video:  '📹',
  phone:  '📞',
  onsite: '🏢',
}

export function interviewInviteEmail(data: InterviewEmailData, recipient: 'candidate' | 'recruiter'): { subject: string; html: string } {
  const isCandidate = recipient === 'candidate'
  const subject = data.isReminder
    ? `Rappel — Votre entretien demain : ${data.jobTitle} chez ${data.companyName}`
    : `Entretien planifié — ${data.jobTitle} chez ${data.companyName}`

  const primaryColor = '#FF6B35'
  const violet = '#6D3BEB'
  const ink = '#1A1410'
  const cream = '#FFF7EE'

  const visioSection = data.visioLink ? `
    <div style="background:#E5DCFF;border:1.5px solid ${ink};border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:${ink};margin-bottom:10px;">Lien de connexion</div>
      <a href="${data.visioLink}"
        style="display:inline-block;background:${violet};color:white;font-weight:800;font-size:15px;padding:12px 28px;border-radius:8px;border:1.5px solid ${ink};text-decoration:none;box-shadow:3px 3px 0 ${ink};">
        Rejoindre la visioconférence
      </a>
      <div style="font-size:11px;color:#6B5A4A;margin-top:8px;">${data.visioLink}</div>
    </div>` : ''

  const locationSection = data.location ? `
    <div style="padding:14px 18px;background:#FBEFE0;border:1.5px solid #E8DDC9;border-radius:10px;margin:12px 0;">
      <span style="font-size:13px;font-weight:700;color:${ink};">Lieu :</span>
      <span style="font-size:13px;color:#2A2018;margin-left:6px;">${data.location}</span>
    </div>` : ''

  const notesSection = data.notes ? `
    <div style="padding:14px 18px;background:#FFF7EE;border:1.5px dashed #E8DDC9;border-radius:10px;margin:12px 0;">
      <div style="font-size:12px;font-weight:700;color:#6B5A4A;margin-bottom:4px;">Notes du recruteur</div>
      <div style="font-size:13px;color:#2A2018;line-height:1.5;">${data.notes}</div>
    </div>` : ''

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2E4D0;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#FFF7EE;border:1.5px solid ${ink};border-radius:16px;overflow:hidden;box-shadow:5px 5px 0 ${ink};">

    <!-- Header -->
    <div style="background:${primaryColor};padding:28px 32px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,247,238,0.15);"></div>
      <div style="position:relative;z-index:1;">
        <div style="font-size:22px;font-weight:800;color:${ink};letter-spacing:-0.03em;">kazajob</div>
        <div style="font-size:13px;color:${ink};opacity:0.75;margin-top:2px;">Le travail péi, nouvelle génération</div>
      </div>
    </div>

    <!-- Badge type -->
    <div style="padding:24px 32px 0;">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#E5DCFF;border:1.5px solid ${ink};border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;color:${ink};">
        ${typeIcons[data.type]} ${typeLabels[data.type]}
        ${data.isReminder ? ' — Rappel J-1' : ''}
      </div>
    </div>

    <!-- Body -->
    <div style="padding:24px 32px;">
      <h1 style="font-size:26px;font-weight:800;color:${ink};letter-spacing:-0.025em;margin:0 0 8px;">
        ${data.isReminder ? 'Votre entretien est demain !' : 'Entretien planifié'}
      </h1>
      <p style="font-size:14px;color:#2A2018;line-height:1.55;margin:0 0 20px;">
        ${isCandidate
          ? `Bonjour <strong>${data.candidateName}</strong>, <strong>${data.recruiterName}</strong> de <strong>${data.companyName}</strong> a planifié un entretien avec vous pour le poste de <strong>${data.jobTitle}</strong>.`
          : `Votre entretien avec <strong>${data.candidateName}</strong> pour le poste <strong>${data.jobTitle}</strong> est confirmé.`
        }
      </p>

      <!-- Détails entretien -->
      <div style="background:white;border:1.5px solid ${ink};border-radius:12px;padding:20px;box-shadow:3px 3px 0 #E8DDC9;margin-bottom:16px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:#6B5A4A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Date</div>
            <div style="font-size:14px;font-weight:700;color:${ink};">${formatDate(data.scheduledAt)}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#6B5A4A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Heure</div>
            <div style="font-size:14px;font-weight:700;color:${ink};">${formatTime(data.scheduledAt)}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#6B5A4A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Durée</div>
            <div style="font-size:14px;font-weight:700;color:${ink};">${data.durationMin} minutes</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#6B5A4A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Poste</div>
            <div style="font-size:14px;font-weight:700;color:${ink};">${data.jobTitle}</div>
          </div>
        </div>
      </div>

      ${visioSection}
      ${locationSection}
      ${notesSection}

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0 0;">
        <a href="https://kazajob.re/candidate/messages"
          style="display:inline-block;background:${primaryColor};color:${ink};font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;border:1.5px solid ${ink};text-decoration:none;box-shadow:4px 4px 0 ${ink};">
          Voir dans Kazajob →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #E8DDC9;font-size:11px;color:#6B5A4A;text-align:center;line-height:1.5;">
      Kazajob SAS · Saint-Denis, La Réunion 974<br>
      <a href="https://kazajob.re" style="color:#FF6B35;text-decoration:none;">kazajob.re</a> ·
      Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
    </div>
  </div>
</body>
</html>`

  return { subject, html }
}

export function applicationWithdrawnEmail(data: {
  recruiterName: string
  candidateName: string
  jobTitle: string
}): { subject: string; html: string } {
  const subject = `Candidature retirée — ${data.candidateName} pour ${data.jobTitle}`
  const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F2E4D0;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#FFF7EE;border:1.5px solid #1A1410;border-radius:16px;overflow:hidden;box-shadow:5px 5px 0 #1A1410;">
    <div style="background:#FF6B35;padding:24px 32px;">
      <div style="font-size:20px;font-weight:800;color:#1A1410;">kazajob</div>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="font-size:22px;font-weight:800;color:#1A1410;margin:0 0 12px;">Candidature retirée</h2>
      <p style="font-size:14px;color:#2A2018;line-height:1.55;">
        Bonjour <strong>${data.recruiterName}</strong>,<br><br>
        <strong>${data.candidateName}</strong> a retiré sa candidature pour le poste de <strong>${data.jobTitle}</strong>.
      </p>
      <p style="font-size:13px;color:#6B5A4A;margin-top:16px;">
        Le candidat a décidé de ne pas poursuivre le processus. Vous pouvez explorer d'autres candidats pour ce poste.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://kazajob.re/recruiter/applications" style="display:inline-block;background:#FF6B35;color:#1A1410;font-weight:800;font-size:14px;padding:12px 28px;border-radius:10px;border:1.5px solid #1A1410;text-decoration:none;box-shadow:3px 3px 0 #1A1410;">
          Voir mes candidatures →
        </a>
      </div>
    </div>
    <div style="padding:12px 32px;border-top:1px solid #E8DDC9;font-size:11px;color:#6B5A4A;text-align:center;">
      Kazajob SAS · Saint-Denis, La Réunion 974 · <a href="https://kazajob.re" style="color:#FF6B35;text-decoration:none;">kazajob.re</a>
    </div>
  </div>
</body></html>`
  return { subject, html }
}
