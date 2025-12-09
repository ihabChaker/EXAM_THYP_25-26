# Examen THYP du 9 décembre 2025

## Benakcha Iheb Chaker
## Diagramme Entité‑Association (Mermaid)

Voici un diagramme Entité‑Association (ER) en syntaxe Mermaid pour modéliser un vocabulaire RDF/Turtle gérant les évaluations des étudiants dans les cours d'un Master.

```mermaid
erDiagram
		STUDENT {
			string studentId PK
			string name
			string email
		}
		COURSE {
			string courseId PK
			string title
			string code
			int credits
		}
		INSTRUCTOR {
			string instructorId PK
			string name
			string email
		}
		EVALUATION {
			string evalId PK
			date date
			decimal maxScore
		}
		GRADE {
			string gradeId PK
			decimal score
		}

		STUDENT ||--o{ GRADE : receives
		COURSE ||--o{ GRADE : contains
		EVALUATION ||--o{ GRADE : produces
		INSTRUCTOR ||--o{ COURSE : teaches
		COURSE ||--o{ EVALUATION : includes
		STUDENT ||--o{ EVALUATION : participates_in

```