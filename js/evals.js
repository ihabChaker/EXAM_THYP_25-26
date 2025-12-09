import { Omk } from '../modules/omk.js';

// Configuration Omeka S
const omk = new Omk({
    api: 'http://localhost/omk_thyp_25-26_clone/api/',
    ident: 'bEpYCjsA9NBDJCycS3zr9V6U8jG01uCV',
    key: 'SGq1DfG1vg72aoQcW1d9UKurfoSRiv5O'
});

let allEtudiants = [];
let allCours = [];
let allInscriptions = [];

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
 * Utilitaire pour extraire les ressources liées
 */
async function getLinkedResources(item, propTerm) {
    const values = item[propTerm];
    if (!values || values.length === 0) return [];

    const resources = [];
    for (const value of values) {
        if (value['value_resource_id']) {
            const linked = omk.getItem(value['value_resource_id']);
            resources.push(linked);
        }
    }
    return resources;
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
 * Récupérer toutes les inscriptions (évaluations)
 */
async function getInscriptions() {
    try {
        const inscriptionClass = omk.getClassByTerm('ev:Inscription');
        if (!inscriptionClass) {
            throw new Error('Classe ev:Inscription non trouvée');
        }

        return await omk.getItems({
            resource_class_id: inscriptionClass['o:id'],
            per_page: 1000
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des inscriptions:', error);
        throw error;
    }
}

/**
 * Créer une nouvelle évaluation (inscription)
 */
async function setEval(etudiantId, coursId, noteValeur) {
    try {
        const inscriptionClass = omk.getClassByTerm('ev:Inscription');
        const identifierPropId = omk.getPropId('dcterms:identifier');
        const titlePropId = omk.getPropId('dcterms:title');
        const noteValeurPropId = omk.getPropId('ev:noteValeur');
        const estInscritPropId = omk.getPropId('ev:estInscrit');
        const pourCoursPropId = omk.getPropId('ev:pourCours');

        // Générer un identifiant unique
        const identifier = `INSCR-${Date.now()}`;

        const inscriptionData = {
            '@type': 'o:Item',
            'o:resource_class': {
                'o:id': inscriptionClass['o:id']
            },
            [titlePropId]: [{
                'type': 'literal',
                'property_id': titlePropId,
                '@value': `Inscription ${identifier}`
            }],
            [identifierPropId]: [{
                'type': 'literal',
                'property_id': identifierPropId,
                '@value': identifier
            }],
            [noteValeurPropId]: [{
                'type': 'literal',
                'property_id': noteValeurPropId,
                '@value': noteValeur.toString()
            }],
            [estInscritPropId]: [{
                'type': 'resource',
                'property_id': estInscritPropId,
                'value_resource_id': etudiantId
            }],
            [pourCoursPropId]: [{
                'type': 'resource',
                'property_id': pourCoursPropId,
                'value_resource_id': coursId
            }]
        };

        // Utiliser POST pour créer un nouvel item
        const url = omk.api + 'items?key_identity=' + omk.ident + '&key_credential=' + omk.key;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inscriptionData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la création de l\'évaluation:', error);
        throw error;
    }
}

/**
 * Afficher les évaluations
 */
async function showEval(inscriptionsList) {
    const container = document.getElementById('evalsContainer');

    if (!inscriptionsList || inscriptionsList.length === 0) {
        container.innerHTML = `
            <div class="message message-info">
                <p>Aucune évaluation trouvée.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    for (const inscription of inscriptionsList) {
        const identifiant = getPropValue(inscription, 'dcterms:identifier') || 'N/A';
        const noteValeur = getPropValue(inscription, 'ev:noteValeur') || 'N/A';

        // Debug: afficher la structure de l'inscription
        console.log('Inscription:', inscription);
        console.log('Note brute:', inscription['ev:noteValeur']);
        console.log('Note extraite:', noteValeur);

        // Récupérer l'étudiant lié
        const etudiants = await getLinkedResources(inscription, 'ev:estInscrit');
        const etudiant = etudiants.length > 0 ? etudiants[0] : null;
        const etudiantNom = etudiant ? (getPropValue(etudiant, 'ev:nom') || 'Étudiant inconnu') : 'Étudiant inconnu';
        const etudiantCourriel = etudiant ? (getPropValue(etudiant, 'ev:courriel') || '') : '';

        // Récupérer le cours lié
        const coursList = await getLinkedResources(inscription, 'ev:pourCours');
        const cours = coursList.length > 0 ? coursList[0] : null;
        const coursTitre = cours ? (getPropValue(cours, 'dcterms:title') || 'Cours inconnu') : 'Cours inconnu';
        const coursCode = cours ? (getPropValue(cours, 'ev:code') || '') : '';

        // Déterminer le badge de note
        let noteBadgeClass = 'badge-primary';
        const noteNum = parseFloat(noteValeur);
        if (!isNaN(noteNum)) {
            if (noteNum >= 16) noteBadgeClass = 'badge-success';
            else if (noteNum >= 10) noteBadgeClass = 'badge-primary';
            else noteBadgeClass = 'badge-warning';
        }

        const evalCard = document.createElement('div');
        evalCard.className = 'list-item';
        evalCard.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-title">Étudiant: ${etudiantNom}</div>
                    <div class="item-title">Note: ${noteValeur}</div>
                    <div class="item-title">Cours: ${coursTitre}</div>
                </div>
                
            </div>
            <div class="item-content">
                <div class="item-meta">
                    ${etudiantCourriel ? `
                        <div class="meta-item">
                            <span>✉️</span>
                            <span>${etudiantCourriel}</span>
                        </div>
                    ` : ''}
                   
                    ${coursCode ? `
                        <div class="meta-item">
                            <span>📋</span>
                            <span>Code: ${coursCode}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        container.appendChild(evalCard);
    }
}

/**
 * Peupler les selects du formulaire
 */
function populateSelects() {
    const etudiantSelect = document.getElementById('etudiantSelect');
    const coursSelect = document.getElementById('coursSelect');

    // Peupler select étudiants
    allEtudiants.forEach(etudiant => {
        const nom = getPropValue(etudiant, 'ev:nom') || 'Nom inconnu';
        const identifiant = getPropValue(etudiant, 'dcterms:identifier') || '';
        const option = document.createElement('option');
        option.value = etudiant['o:id'];
        option.textContent = `${nom} ${identifiant ? `(${identifiant})` : ''}`;
        etudiantSelect.appendChild(option);
    });

    // Peupler select cours
    allCours.forEach(cours => {
        const titre = getPropValue(cours, 'dcterms:title') || 'Cours inconnu';
        const code = getPropValue(cours, 'ev:code') || '';
        const option = document.createElement('option');
        option.value = cours['o:id'];
        option.textContent = `${titre} ${code ? `(${code})` : ''}`;
        coursSelect.appendChild(option);
    });
}

/**
 * Gérer la soumission du formulaire
 */
async function handleSubmitEval(event) {
    event.preventDefault();

    const etudiantId = parseInt(document.getElementById('etudiantSelect').value);
    const coursId = parseInt(document.getElementById('coursSelect').value);
    const noteValeur = parseFloat(document.getElementById('noteInput').value);

    const messageDiv = document.getElementById('formMessage');
    messageDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Enregistrement en cours...</p></div>';

    try {
        await setEval(etudiantId, coursId, noteValeur);

        messageDiv.innerHTML = `
            <div class="message message-success" style="margin-top: 1rem;">
                <p>✅ Évaluation enregistrée avec succès!</p>
            </div>
        `;

        // Réinitialiser le formulaire
        document.getElementById('evalForm').reset();

        // Recharger les évaluations
        allInscriptions = await getInscriptions();
        await showEval(allInscriptions);

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
        // Initialiser Omeka (charger propriétés et classes)
        omk.init();

        // Charger toutes les données
        [allEtudiants, allCours, allInscriptions] = await Promise.all([
            getEtudiants(),
            getCours(),
            getInscriptions()
        ]);

        // Peupler les selects
        populateSelects();

        // Afficher les évaluations
        await showEval(allInscriptions);

    } catch (error) {
        const container = document.getElementById('evalsContainer');
        container.innerHTML = `
            <div class="message message-error">
                <p><strong>Erreur:</strong> ${error.message}</p>
                <p>Vérifiez que le vocabulaire 'ev' est importé dans Omeka S et que les clés API sont correctes.</p>
            </div>
        `;
    }
}

// Exposer les fonctions pour les boutons HTML
window.handleSubmitEval = handleSubmitEval;

// Lancer l'initialisation au chargement de la page
init();
