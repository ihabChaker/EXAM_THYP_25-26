# Examen THYP du 9 décembre 2025

## Benakcha Iheb Chaker
## Diagramme Entité‑Association (Mermaid)

Voici un diagramme Entité‑Association (ER) en syntaxe Mermaid pour modéliser un vocabulaire RDF/Turtle gérant les évaluations des étudiants dans les cours d'un Master.

```mermaid
erDiagram
		ETUDIANT {
			string identifiant PK
			string nom
			string courriel
		}
		COURS {
			string identifiant PK
			string titre
			string code
			int credits
		}
		ENSEIGNANT {
			string identifiant PK
			string nom
			string courriel
		}
		NOTE {
			string identifiant PK
			decimal noteValeur
		}

		ETUDIANT ||--o{ NOTE : recoit
		COURS ||--o{ NOTE : contient
		ENSEIGNANT ||--o{ COURS : enseigne

```
## Diagramme Entité‑Association (Mermaid)

Voici un diagramme Entité‑Association (ER) en syntaxe Mermaid pour modéliser un vocabulaire RDF/Turtle gérant les notes (grades) des étudiants dans les cours d'un Master — la notion d'"Evaluation" a été retirée.

```mermaid
erDiagram
    ETUDIANT {
      string identifiant PK
      string nom
      string courriel
    }
    COURS {
      string identifiant PK
      string titre
      string code
      int credits
    }
    ENSEIGNANT {
      string identifiant PK
      string nom
      string courriel
    }
    INSCRIPTION {
        string identifiant PK
        decimal noteValeur
    }

    ETUDIANT ||--o{ INSCRIPTION : estInscrit
    COURS ||--o{ INSCRIPTION : contientInscription
    ENSEIGNANT ||--o{ COURS : enseigne

```