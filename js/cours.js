import { Omk } from '../modules/omk.js';

// Configuration Omeka S
const omk = new Omk({
    api: 'http://localhost/omk_thyp_25-26_clone/api/',
    ident: 'neecG2mXbk1MDcdL4t2vnYx3BxtVL0OM',
    key: 'KrpZ7cl2tRCoYhpIC7zVkbLOpSKONsPx',
});

let allCours = [];
let filteredCours = [];

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
 * Récupérer tous les cours depuis l'API
 */
async function getCours() {
    try {
        const coursClass = omk.getClassByTerm('ev:Cours');
        if (!coursClass) {
            throw new Error('Classe ev:Cours non trouvée');
        }

        const cours = await omk.getItems({
            resource_class_id: coursClass['o:id'],
            per_page: 1000
        });

        return cours;
    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error);
        throw error;
    }
}

/**
 * Récupérer les étudiants inscrits à un cours
 */
async function getEtudiantsInscrits(cours) {
    try {
        // Récupérer les inscriptions liées au cours via ev:contientInscription
        const inscriptions = await getLinkedResources(cours, 'ev:contientInscription');

        const etudiants = [];
        for (const inscription of inscriptions) {
            // Pour chaque inscription, récupérer l'étudiant via ev:estInscrit (inverse)
            const etudiantsLinked = await getLinkedResources(inscription, 'ev:estInscrit');
            if (etudiantsLinked.length > 0) {
                const etudiant = etudiantsLinked[0];
                const noteValeur = getPropValue(inscription, 'ev:noteValeur');
                etudiants.push({
                    id: etudiant['o:id'],
                    nom: getPropValue(etudiant, 'ev:nom'),
                    courriel: getPropValue(etudiant, 'ev:courriel'),
                    note: noteValeur
                });
            }
        }

        return etudiants;
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error);
        return [];
    }
}

/**
 * Afficher la liste des cours
 */
async function showCours(coursList) {
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

    for (const cours of coursList) {
        const identifiant = getPropValue(cours, 'dcterms:identifier') || 'N/A';
        const titre = getPropValue(cours, 'dcterms:title') || 'Sans titre';
        const code = getPropValue(cours, 'ev:code') || 'N/A';
        const credits = getPropValue(cours, 'ev:credits') || '0';

        // Récupérer les étudiants inscrits
        const etudiants = await getEtudiantsInscrits(cours);

        const coursCard = document.createElement('div');
        coursCard.className = 'list-item';
        coursCard.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-title">${titre}</div>
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
                    <div class="meta-item">
                        <span>👥</span>
                        <span><strong>${etudiants.length}</strong> étudiant(s) inscrit(s)</span>
                    </div>
                </div>
                
                ${etudiants.length > 0 ? `
                    <div class="students-list">
                        <div class="students-header">Étudiants inscrits</div>
                        <div class="student-tags">
                            ${etudiants.map(etudiant => `
                                <div class="student-tag" title="${etudiant.courriel || 'Pas de courriel'}">
                                    <span>👤</span>
                                    <span>${etudiant.nom || 'Nom inconnu'}</span>
                                    ${etudiant.note ? `<span class="badge badge-success">${etudiant.note}/20</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        container.appendChild(coursCard);
    }
}

/**
 * Appliquer les filtres
 */
function applyFilters() {
    const filterCode = document.getElementById('filterCode').value.toLowerCase();
    const filterTitre = document.getElementById('filterTitre').value.toLowerCase();
    const filterCredits = document.getElementById('filterCredits').value;

    filteredCours = allCours.filter(cours => {
        const code = (getPropValue(cours, 'ev:code') || '').toLowerCase();
        const titre = (getPropValue(cours, 'dcterms:title') || '').toLowerCase();
        const credits = parseInt(getPropValue(cours, 'ev:credits') || '0');

        let matches = true;

        if (filterCode && !code.includes(filterCode)) {
            matches = false;
        }

        if (filterTitre && !titre.includes(filterTitre)) {
            matches = false;
        }

        if (filterCredits && credits < parseInt(filterCredits)) {
            matches = false;
        }

        return matches;
    });

    showCours(filteredCours);
}

/**
 * Réinitialiser les filtres
 */
function resetFilters() {
    document.getElementById('filterCode').value = '';
    document.getElementById('filterTitre').value = '';
    document.getElementById('filterCredits').value = '';

    filteredCours = [...allCours];
    showCours(filteredCours);
}

/**
 * Initialisation
 */
async function init() {
    try {
        // Initialiser Omeka (charger propriétés et classes)
        omk.init();

        allCours = await getCours();
        filteredCours = [...allCours];
        await showCours(filteredCours);
    } catch (error) {
        const container = document.getElementById('coursContainer');
        container.innerHTML = `
            <div class="message message-error">
                <p><strong>Erreur:</strong> ${error.message}</p>
                <p>Vérifiez que le vocabulaire 'ev' est importé dans Omeka S et que les clés API sont correctes.</p>
            </div>
        `;
    }
}

// Exposer les fonctions pour les boutons HTML
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;

// Lancer l'initialisation au chargement de la page
init();
