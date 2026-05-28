-- ============================================================
-- KAZAJOB — Seed data (données de démonstration)
-- ============================================================

-- Skills
INSERT INTO skills (name, category) VALUES
  ('React', 'Frontend'), ('Vue.js', 'Frontend'), ('Angular', 'Frontend'),
  ('TypeScript', 'Frontend'), ('JavaScript', 'Frontend'),
  ('Node.js', 'Backend'), ('Python', 'Backend'), ('PHP', 'Backend'), ('Java', 'Backend'),
  ('PostgreSQL', 'Database'), ('MySQL', 'Database'), ('MongoDB', 'Database'),
  ('Docker', 'DevOps'), ('Kubernetes', 'DevOps'), ('AWS', 'Cloud'), ('Git', 'Outils'),
  ('Figma', 'Design'), ('Adobe XD', 'Design'), ('Photoshop', 'Design'),
  ('Sage', 'Comptabilite'), ('Excel', 'Bureautique'), ('PowerPoint', 'Bureautique'),
  ('Communication', 'Soft skills'), ('Management', 'Soft skills'), ('Anglais', 'Langues'),
  ('Espagnol', 'Langues'), ('Creole', 'Langues')
ON CONFLICT (name) DO NOTHING;

-- Companies
INSERT INTO companies (name, location, sector, description, is_verified) VALUES
  ('Run Tech', 'Saint-Denis', 'Informatique & Tech', 'Agence de développement web basée à Saint-Denis.', true),
  ('Ile Digital', 'Saint-Paul', 'Informatique & Tech', 'Studio créatif spécialisé UX/UI.', true),
  ('Bourbon Co', 'Le Tampon', 'Finance & Comptabilité', 'Cabinet comptable historique de La Réunion.', true),
  ('Volcania', 'Saint-Pierre', 'Marketing & Communication', 'Agence de communication digitale 974.', true),
  ('Cilaos Group', 'Cilaos', 'Santé & Social', 'Groupe médical des Hauts de La Réunion.', true),
  ('Saint-Gilles SA', 'Saint-Gilles', 'Tourisme & Hôtellerie', 'Hôtels et résidences bord de mer.', false),
  ('Pailles & Co', 'Saint-André', 'Agriculture & Agroalimentaire', 'Production et distribution agro-alimentaire.', true)
ON CONFLICT DO NOTHING;
