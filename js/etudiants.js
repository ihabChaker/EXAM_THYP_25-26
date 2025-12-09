import { Omk } from '../modules/omk.js';

// Configuration Omeka S
const omk = new Omk({
    api: 'http://localhost/omk_thyp_25-26_clone/api/',
    ident: 'bEpYCjsA9NBDJCycS3zr9V6U8jG01uCV',
    key: 'SGq1DfG1vg72aoQcW1d9UKurfoSRiv5O'
});

let allEtudiants = [];
let allCours = [];

/**
 * Utilitaire pour extraire la valeur d'une propriété
 */
function getPropValue(item, propTerm) {
    const values = item[propTerm];
    if (!values || values.length === 0) return null;

    const value = values[0];
    if (value['@value']) return value['@value'];
    if (value['o:label']) return value['o:label'];
    if (value['@id']) return value['@id'];
    return null;
}

/**
 * Récupérer tous les étudiants
 */
async function getEtudiants() {
    try {
        const etudiantClass = omk.getClassByTerm('ev:Etudiant');
        if (!etudiantClass) {
            throw new Error('Classe ev:Etudiant non trouvée');
        }

        return await omk.getItems({
            resource_class_id: etudiantClass['o:id'],
            per_page: 1000
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error);
        throw error;
    }
}

/**
 * Récupérer tous les cours
 */
async function getCours() {
    try {
        const coursClass = omk.getClassByTerm('ev:Cours');
        if (!coursClass) {
            throw new Error('Classe ev:Cours non trouvée');
        }

        return await omk.getItems({
            resource_class_id: coursClass['o:id'],
            per_page: 1000
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error);
        throw error;
    }
}

/**
 * Créer un nouvel étudiant
 */
async function createEtudiant(identifiant, nom, courriel) {
    try {
        const etudiantClass = omk.getClassByTerm('ev:Etudiant');
        const identifierPropId = omk.getPropId('dcterms:identifier');
        const titlePropId = omk.getPropId('dcterms:title');
        const nomPropId = omk.getPropId('ev:nom');
        const courrielPropId = omk.getPropId('ev:courriel');

        const etudiantData = {
            '@type': 'o:Item',
            'o:resource_class': {
                'o:id': etudiantClass['o:id']
            },
            [titlePropId]: [{
                'type': 'literal',
                'property_id': titlePropId,
                '@value': nom
            }],
            [identifierPropId]: [{
                'type': 'literal',
                'property_id': identifierPropId,
                '@value': identifiant
            }],
            [nomPropId]: [{
                'type': 'literal',
                'property_id': nomPropId,
                '@value': nom
            }],
            [courrielPropId]: [{
                'type': 'literal',
                'property_id': courrielPropId,
                '@value': courriel
            }]
        };

        // Utiliser POST pour créer un nouvel item
        const url = omk.api + 'items?key_identity=' + omk.ident + '&key_credential=' + omk.key;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(etudiantData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la création de l\'étudiant:', error);
        throw error;
    }
}

/**
 * Créer un nouveau cours
 */
async function createCours(identifiant, titre, code, credits) {
    try {
        const coursClass = omk.getClassByTerm('ev:Cours');
        const identifierPropId = omk.getPropId('dcterms:identifier');
        const titlePropId = omk.getPropId('dcterms:title');
        const codePropId = omk.getPropId('ev:code');
        const creditsPropId = omk.getPropId('ev:credits');

        const coursData = {
            '@type': 'o:Item',
            'o:resource_class': {
                'o:id': coursClass['o:id']
            },
            [titlePropId]: [{
                'type': 'literal',
                'property_id': titlePropId,
                '@value': titre
            }],
            [identifierPropId]: [{
                'type': 'literal',
                'property_id': identifierPropId,
                '@value': identifiant
            }],
            [codePropId]: [{
                'type': 'literal',
                'property_id': codePropId,
                '@value': code
            }],
            [creditsPropId]: [{
                'type': 'literal',
                'property_id': creditsPropId,
                '@value': credits.toString()
            }]
        };

        // Utiliser POST pour créer un nouvel item
        const url = omk.api + 'items?key_identity=' + omk.ident + '&key_credential=' + omk.key;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(coursData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la création du cours:', error);
        throw error;
    }
}

/**
 * Afficher la liste des étudiants
 */
function showEtudiants(etudiantsList) {
    const container = document.getElementById('etudiantsContainer');

    if (!etudiantsList || etudiantsList.length === 0) {
        container.innerHTML = `
            <div class="message message-info">
                <p>Aucun étudiant trouvé.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    etudiantsList.forEach(etudiant => {
        const identifiant = getPropValue(etudiant, 'dcterms:identifier') || 'N/A';
        const nom = getPropValue(etudiant, 'ev:nom') || 'Sans nom';
        const courriel = getPropValue(etudiant, 'ev:courriel') || 'N/A';

        const etudiantCard = document.createElement('div');
        etudiantCard.className = 'list-item';
        etudiantCard.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-title">👤 ${nom}</div>
                    <div class="item-id">${identifiant}</div>
                </div>
            </div>
            <div class="item-content">
                <div class="item-meta">
                    <div class="meta-item">
                        <span>✉️</span>
                        <span>${courriel}</span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(etudiantCard);
    });
}

/**
 * Afficher la liste des cours
 */
function showCoursSimple(coursList) {
    const container = document.getElementById('coursContainer');

    if (!coursList || coursList.length === 0) {
        container.innerHTML = `
            <div class="message message-info">
                <p>Aucun cours trouvé.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    coursList.forEach(cours => {
        const identifiant = getPropValue(cours, 'dcterms:identifier') || 'N/A';
        const titre = getPropValue(cours, 'dcterms:title') || 'Sans titre';
        const code = getPropValue(cours, 'ev:code') || 'N/A';
        const credits = getPropValue(cours, 'ev:credits') || '0';

        const coursCard = document.createElement('div');
        coursCard.className = 'list-item';
        coursCard.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-title">📚 ${titre}</div>
                    <div class="item-id">${identifiant}</div>
                </div>
                <span class="badge badge-primary">${credits} crédits</span>
            </div>
            <div class="item-content">
                <div class="item-meta">
                    <div class="meta-item">
                        <span>📋</span>
                        <span>Code: <strong>${code}</strong></span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(coursCard);
    });
}

/**
 * Gérer la soumission du formulaire étudiant
 */
async function handleSubmitEtudiant(event) {
    event.preventDefault();

    const identifiant = document.getElementById('identifiantInput').value;
    const nom = document.getElementById('nomInput').value;
    const courriel = document.getElementById('courrielInput').value;

    const messageDiv = document.getElementById('etudiantFormMessage');
    messageDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Enregistrement en cours...</p></div>';

    try {
        await createEtudiant(identifiant, nom, courriel);

        messageDiv.innerHTML = `
            <div class="message message-success" style="margin-top: 1rem;">
                <p>✅ Étudiant créé avec succès!</p>
            </div>
        `;

        // Réinitialiser le formulaire
        document.getElementById('etudiantForm').reset();

        // Recharger les étudiants
        allEtudiants = await getEtudiants();
        showEtudiants(allEtudiants);

        // Effacer le message après 3 secondes
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);

    } catch (error) {
        messageDiv.innerHTML = `
            <div class="message message-error" style="margin-top: 1rem;">
                <p><strong>Erreur:</strong> ${error.message}</p>
            </div>
        `;
    }
}

/**
 * Gérer la soumission du formulaire cours
 */
async function handleSubmitCours(event) {
    event.preventDefault();

    const identifiant = document.getElementById('coursIdentifiantInput').value;
    const titre = document.getElementById('titreInput').value;
    const code = document.getElementById('codeInput').value;
    const credits = parseInt(document.getElementById('creditsInput').value);

    const messageDiv = document.getElementById('coursFormMessage');
    messageDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Enregistrement en cours...</p></div>';

    try {
        await createCours(identifiant, titre, code, credits);

        messageDiv.innerHTML = `
            <div class="message message-success" style="margin-top: 1rem;">
                <p>✅ Cours créé avec succès!</p>
            </div>
        `;

        // Réinitialiser le formulaire
        document.getElementById('coursForm').reset();

        // Recharger les cours
        allCours = await getCours();
        showCoursSimple(allCours);

        // Effacer le message après 3 secondes
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);

    } catch (error) {
        messageDiv.innerHTML = `
            <div class="message message-error" style="margin-top: 1rem;">
                <p><strong>Erreur:</strong> ${error.message}</p>
            </div>
        `;
    }
}

/**
 * Initialisation
 */
async function init() {
    try {
        omk.init();
        // Charger les données
        [allEtudiants, allCours] = await Promise.all([
            getEtudiants(),
            getCours()
        ]);

        // Afficher les listes
        showEtudiants(allEtudiants);
        showCoursSimple(allCours);

    } catch (error) {
        document.getElementById('etudiantsContainer').innerHTML = `
            <div class="message message-error">
                <p><strong>Erreur:</strong> ${error.message}</p>
            </div>
        `;
        document.getElementById('coursContainer').innerHTML = `
            <div class="message message-error">
                <p><strong>Erreur:</strong> ${error.message}</p>
            </div>
        `;
    }
}

// Exposer les fonctions pour les boutons HTML
window.handleSubmitEtudiant = handleSubmitEtudiant;
window.handleSubmitCours = handleSubmitCours;

// Lancer l'initialisation au chargement de la page
init();
