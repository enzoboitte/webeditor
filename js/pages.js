// ========== SYSTÈME DE GESTION DES PAGES ==========

// Afficher un état vide lorsque aucune page n'existe
C_App.prototype.f_vUpdateWorkspaceState = function() {
    const hasPages = Array.isArray(this.G_lPages) && this.G_lPages.length > 0;
    const workspace = document.getElementById('G_sWorkspace');
    const emptyState = document.getElementById('G_sWorkspaceEmpty');

    if (workspace) {
        workspace.style.display = hasPages ? '' : 'none';
    }
    if (emptyState) {
        emptyState.style.display = hasPages ? 'none' : 'flex';
    }
};

// Initialisation du système de pages
C_App.prototype.f_vInitPages = function() {
    if (Array.isArray(this.G_lPages) && this.G_lPages.length > 0) {
        this.f_vUpdateWorkspaceState();
        return;
    }

    this.G_lPages = [];
    // Créer la page d'accueil par défaut
    const homePage = {
        id: 'page_' + (++this.G_iPageCounter),
        title: 'Accueil',
        route: '/',
        icon: '🏠',
        favicon: 'favicon.ico',
        isMainPage: true, // Page principale par défaut
        elements: [], // Éléments spécifiques à cette page
        meta: {
            description: 'Page d\'accueil',
            keywords: ''
        }
    };
    
    this.G_lPages.push(homePage);
    this.G_cCurrentPage = homePage;
    this.f_vRenderPagesList();
    this.f_vUpdateWorkspaceState();
};

// Créer une nouvelle page
C_App.prototype.f_vCreatePage = function() {
    this.f_vPrompt(
        'Entrez le titre de la nouvelle page:',
        (title) => {
            if (!title) return;
            
            this.f_vPrompt(
                'Entrez la route de la page (ex: /contact):',
                (route) => {
                    if (!route) return;
                    
                    // Vérifier si la route existe déjà
                    if (this.G_lPages.some(p => p.route === route)) {
                        this.f_vAlertError('Cette route existe déjà', 'Route en doublon');
                        return;
                    }
                    
                    const newPage = {
                        id: 'page_' + (++this.G_iPageCounter),
                        title: title,
                        route: route.startsWith('/') ? route : '/' + route,
                        icon: '📄',
                        favicon: 'favicon.ico',
                        isMainPage: false,
                        elements: [],
                        meta: {
                            description: '',
                            keywords: ''
                        }
                    };
                    
                    const wasEmpty = this.G_lPages.length === 0;
                    this.G_lPages.push(newPage);

                    if (wasEmpty) {
                        this.f_vLoadPage(newPage.id, null, true);
                    } else {
                        this.f_vRenderPagesList();
                    }
                    this.f_vShowToast(`Page "${title}" créée`, 'success', 2000);
                },
                '/nouvelle-page',
                'Route de la page',
                'Ex: /contact'
            );
        },
        'Nouvelle page',
        'Titre de la page',
        'Ex: Contact'
    );
};

// Afficher la liste des pages dans le panel de gauche
C_App.prototype.f_vRenderPagesList = function() {
    const container = document.getElementById('G_sPagesView');
    if (!container) return;
    
    let html = '<div style="padding: 10px;">';
    html += '<button class="c-btn c-btn-add" onclick="G_cApp.f_vCreatePage()" style="margin-bottom: 15px; width: 100%;">+ Nouvelle page</button>';
    
    if (this.G_lPages.length === 0) {
        html += '<p style="text-align: center; color: #888; padding: 20px;">Aucune page créée</p>';
    } else {
        html += '<div class="c-pages-list">';
        if (!this.G_sSelectedPageId && this.G_cCurrentPage) {
            this.G_sSelectedPageId = this.G_cCurrentPage.id;
        }
        this.G_lPages.forEach((page, index) => {
            const isActive = this.G_cCurrentPage && this.G_cCurrentPage.id === page.id;
            const isSelected = this.G_sSelectedPageId === page.id;
            const activeClass = isActive ? 'active' : '';
            const selectedClass = isSelected && !isActive ? 'selected' : '';
            const mainPageBadge = page.isMainPage ? '<span class="c-main-page-badge">🏠 Principal</span>' : '';
            
            html += `
                <div class="c-page-item ${activeClass} ${selectedClass}" data-page-id="${page.id}" 
                     onclick="G_cApp.f_vSelectPage('${page.id}', event)"
                     ondblclick="G_cApp.f_vLoadPage('${page.id}', event)">
                    <div class="c-page-icon">${page.icon}</div>
                    <div class="c-page-info">
                        <div class="c-page-title">${page.title} ${mainPageBadge}</div>
                        <div class="c-page-route">${page.route}</div>
                    </div>
                    <div class="c-page-actions">
                        <button class="c-btn-icon" onclick="event.stopPropagation(); G_cApp.f_vDeletePage('${page.id}')" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;

    this.f_vUpdateWorkspaceState();
};

// Sélectionner une page (affiche ses propriétés dans le panel droit)
C_App.prototype.f_vSelectPage = function(pageId, event) {
    const page = this.G_lPages.find(p => p.id === pageId);
    if (!page) return;
    
    // Sauvegarder les éléments de la page courante avant de changer
    if (this.G_cCurrentPage && this.G_cCurrentPage.id !== pageId) {
        this.G_cCurrentPage.elements = this.G_lElements.map(e => {
            // Vérifier si c'est déjà un objet JSON ou une instance C_Element
            if (typeof e.F_cToJSON === 'function') {
                return e.F_cToJSON();
            }
            return e; // Déjà au format JSON
        });
    }
    
    // Mémoriser la page sélectionnée pour le rendu et les styles
    this.G_sSelectedPageId = pageId;
    
    // Mettre à jour les classes visuellement sans re-render complet
    const listContainer = document.getElementById('G_sPagesView');
    if (listContainer) {
        const items = listContainer.querySelectorAll('.c-page-item');
        items.forEach(item => {
            if (item.dataset.pageId === pageId) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    this.f_vShowPageProperties(page);
};

// Afficher les propriétés d'une page dans le panel droit
C_App.prototype.f_vShowPageProperties = function(page) {
    // Basculer sur l'onglet propriétés
    this.f_vSwitchRightTab('properties');
    
    const panel = document.getElementById('G_sProperties');
    
    // Si c'est la page courante, sauvegarder les éléments actuels pour avoir le bon compteur
    if (this.G_cCurrentPage && this.G_cCurrentPage.id === page.id) {
        page.elements = this.G_lElements.map(e => {
            // Vérifier si c'est déjà un objet JSON ou une instance C_Element
            if (typeof e.F_cToJSON === 'function') {
                return e.F_cToJSON();
            }
            return e; // Déjà au format JSON
        });
    }
    
    let html = '<div class="c-properties">';
    
    // Stocker la page dont on affiche les propriétés
    this.G_cPagePropertiesShown = page;

    
    // Header avec icône
    html += '<div class="c-property-header">';
    html += `<div class="c-property-header-icon">${page.icon}</div>`;
    html += '<div class="c-property-header-info">';
    html += `<h3>${page.title}</h3>`;
    html += `<span class="c-property-header-route">${page.route}</span>`;
    html += '</div>';
    html += '</div>';
    
    // Section : Informations de base
    html += '<div class="c-property-group">';
    html += '<h4><i class="fas fa-info-circle"></i> Informations de base</h4>';
    
    html += '<div class="c-property">';
    html += '<label>Titre de la page</label>';
    html += `<input type="text" value="${page.title}" onchange="G_cApp.f_vUpdatePageProperty('${page.id}', 'title', this.value)" placeholder="Ex: Accueil">`;
    html += '</div>';
    
    html += '<div class="c-property">';
    html += '<label>Route (URL)</label>';
    html += `<input type="text" value="${page.route}" onchange="G_cApp.f_vUpdatePageProperty('${page.id}', 'route', this.value)" placeholder="Ex: /contact">`;
    html += '<small style="color: #888; font-size: 11px;">La route doit commencer par /</small>';
    html += '</div>';
    
    html += '<div class="c-property">';
    html += '<label>Icône (sidebar)</label>';
    html += `<input type="text" value="${page.icon}" maxlength="2" onchange="G_cApp.f_vUpdatePageProperty('${page.id}', 'icon', this.value)" placeholder="Emoji">`;
    html += '<small style="color: #888; font-size: 11px;">Emoji affiché dans la liste</small>';
    html += '</div>';
    
    html += '<div class="c-property">';
    html += '<label>Favicon (navigateur)</label>';
    html += `<div class="c-favicon-upload" id="favicon-upload-${page.id}" 
             ondrop="G_cApp.f_vHandleFaviconDrop(event, '${page.id}')" 
             ondragover="event.preventDefault(); event.currentTarget.classList.add('dragover')" 
             ondragleave="event.currentTarget.classList.remove('dragover')"
             onclick="G_cApp.f_vOpenFaviconPicker('${page.id}')">`;
    
    if (page.faviconData) {
        html += `<img src="${page.faviconData}" alt="Favicon" class="c-favicon-preview">`;
        html += '<div class="c-favicon-label">Cliquez ou glissez pour changer</div>';
        html += `<button class="c-favicon-remove" onclick="event.stopPropagation(); G_cApp.f_vRemoveFavicon('${page.id}')" title="Supprimer">×</button>`;
    } else {
        html += '<div class="c-favicon-placeholder">';
        html += '<i class="fas fa-image" style="font-size: 32px; color: #888;"></i>';
        html += '<div class="c-favicon-label">Cliquez ou glissez une image</div>';
        html += '<div class="c-favicon-hint">PNG, ICO, SVG (max 512x512)</div>';
        html += '</div>';
    }
    
    html += '</div>';
    html += `<input type="file" id="favicon-file-${page.id}" accept="image/png,image/x-icon,image/svg+xml" style="display: none;" onchange="G_cApp.f_vHandleFaviconFile(event, '${page.id}')">`;
    html += '<small style="color: #888; font-size: 11px;">Icône affichée dans l\'onglet du navigateur (encodée en base64)</small>';
    html += '</div>';
    
    html += '</div>';
    
    // Section : SEO
    html += '<div class="c-property-group">';
    html += '<h4><i class="fas fa-search"></i> Référencement SEO</h4>';
    
    html += '<div class="c-property">';
    html += '<label>Description</label>';
    html += `<textarea onchange="G_cApp.f_vUpdatePageMeta('${page.id}', 'description', this.value)" rows="3" placeholder="Description pour les moteurs de recherche">${page.meta.description}</textarea>`;
    html += `<small style="color: #888; font-size: 11px;">${(page.meta.description || '').length} caractères (150-160 recommandés)</small>`;
    html += '</div>';
    
    html += '<div class="c-property">';
    html += '<label>Mots-clés</label>';
    html += `<input type="text" value="${page.meta.keywords}" onchange="G_cApp.f_vUpdatePageMeta('${page.id}', 'keywords', this.value)" placeholder="mot1, mot2, mot3">`;
    html += '<small style="color: #888; font-size: 11px;">Séparés par des virgules</small>';
    html += '</div>';
    
    html += '</div>';
    
    // Section : Configuration
    html += '<div class="c-property-group">';
    html += '<h4><i class="fas fa-cog"></i> Configuration</h4>';
    
    html += '<div class="c-property">';
    html += '<label style="display: flex; justify-content: space-between; align-items: center;">';
    html += '<span>Page principale (index.html)</span>';
    html += '<label class="c-toggle-switch">';
    html += `<input type="checkbox" ${page.isMainPage ? 'checked' : ''} onchange="G_cApp.f_vSetMainPage('${page.id}', this.checked)">`;
    html += '<span class="c-toggle-slider"></span>';
    html += '</label>';
    html += '</label>';
    html += '<small style="color: #888; font-size: 11px;">Cette page sera générée comme index.html à la racine</small>';
    html += '</div>';
    
    html += '</div>';
    
    // Section : Statistiques
    html += '<div class="c-property-group">';
    html += '<h4><i class="fas fa-chart-bar"></i> Statistiques</h4>';
    html += '<div class="c-property-stat">';
    // Le compteur utilise page.elements qui est maintenant toujours à jour
    const elementsCount = page.elements ? page.elements.length : 0;
    html += `<div class="c-stat-value">${elementsCount}</div>`;
    html += '<div class="c-stat-label">Éléments sur cette page</div>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    panel.innerHTML = html;
};

// Rafraîchir les propriétés de page si elles sont affichées
C_App.prototype.f_vRefreshPageProperties = function() {
    if (this.G_cPagePropertiesShown && this.G_cCurrentPage) {
        // Si on affiche les propriétés de la page courante, les rafraîchir
        if (this.G_cPagePropertiesShown.id === this.G_cCurrentPage.id) {
            this.f_vShowPageProperties(this.G_cCurrentPage);
        }
    }
};

// Mettre à jour une propriété de page
C_App.prototype.f_vUpdatePageProperty = function(pageId, property, value) {
    const page = this.G_lPages.find(p => p.id === pageId);
    if (!page) return;
    
    // Validation pour la route
    if (property === 'route') {
        if (!value.startsWith('/')) {
            value = '/' + value;
        }
        
        // Vérifier les doublons
        if (this.G_lPages.some(p => p.id !== pageId && p.route === value)) {
            this.f_vAlertError('Cette route existe déjà', 'Route en doublon');
            this.f_vShowPageProperties(page); // Rafraîchir
            return;
        }
    }
    
    page[property] = value;
    this.f_vRenderPagesList();
    this.f_vShowPageProperties(page); // Rafraîchir les propriétés
    this.f_vShowToast(`${property} mise à jour`, 'success', 1500);
};

// Définir comme page principale
C_App.prototype.f_vSetMainPage = function(pageId, isMain) {
    // Retirer le flag de toutes les pages
    this.G_lPages.forEach(p => p.isMainPage = false);
    
    if (isMain) {
        const page = this.G_lPages.find(p => p.id === pageId);
        if (page) {
            page.isMainPage = true;
            this.f_vShowToast(`"${page.title}" définie comme page principale`, 'success', 2000);
        }
    }
    
    this.f_vRenderPagesList();
};

// ========== GESTION DU FAVICON ==========

// Ouvrir le sélecteur de fichier
C_App.prototype.f_vOpenFaviconPicker = function(pageId) {
    const input = document.getElementById(`favicon-file-${pageId}`);
    if (input) input.click();
};

// Gérer le fichier sélectionné
C_App.prototype.f_vHandleFaviconFile = function(event, pageId) {
    const file = event.target.files[0];
    if (file) {
        this.f_vProcessFaviconFile(file, pageId);
    }
};

// Gérer le drop de fichier
C_App.prototype.f_vHandleFaviconDrop = function(event, pageId) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        this.f_vProcessFaviconFile(file, pageId);
    } else {
        this.f_vAlertError('Veuillez déposer un fichier image valide (PNG, ICO, SVG)', 'Format invalide');
    }
};

// Traiter le fichier favicon
C_App.prototype.f_vProcessFaviconFile = function(file, pageId) {
    const page = this.G_lPages.find(p => p.id === pageId);
    if (!page) return;
    
    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        this.f_vAlertError('Le fichier est trop volumineux (max 2MB)', 'Fichier trop grand');
        return;
    }
    
    // Lire et encoder en base64
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Vérifier les dimensions (max 512x512)
            if (img.width > 512 || img.height > 512) {
                this.f_vAlertWarning('L\'image est grande. Recommandé : 32x32 ou 64x64 pour un favicon', 'Dimensions importantes');
            }
            
            // Stocker les données base64
            page.faviconData = e.target.result;
            page.faviconType = file.type;
            page.faviconName = file.name;
            
            this.f_vShowPageProperties(page);
            this.f_vShowToast('Favicon ajouté avec succès', 'success', 2000);
        };
        img.onerror = () => {
            this.f_vAlertError('Impossible de charger l\'image', 'Erreur');
        };
        img.src = e.target.result;
    };
    
    reader.onerror = () => {
        this.f_vAlertError('Erreur lors de la lecture du fichier', 'Erreur');
    };
    
    reader.readAsDataURL(file);
};

// Supprimer le favicon
C_App.prototype.f_vRemoveFavicon = function(pageId) {
    const page = this.G_lPages.find(p => p.id === pageId);
    if (!page) return;
    
    this.f_vConfirm(
        'Voulez-vous supprimer le favicon de cette page ?',
        () => {
            delete page.faviconData;
            delete page.faviconType;
            delete page.faviconName;
            this.f_vShowPageProperties(page);
            this.f_vShowToast('Favicon supprimé', 'info', 1500);
        },
        'Supprimer le favicon'
    );
};

// Mettre à jour les métadonnées d'une page
C_App.prototype.f_vUpdatePageMeta = function(pageId, property, value) {
    const page = this.G_lPages.find(p => p.id === pageId);
    if (!page) return;
    
    page.meta[property] = value;
    this.f_vShowToast('Métadonnées mises à jour', 'success', 1500);
};

// Charger une page (double-clic)
C_App.prototype.f_vLoadPage = function(pageId, event, silent = false) {
    // Empêcher le clic simple de se déclencher aussi
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const page = this.G_lPages.find(p => p.id === pageId);
    if (!page) return;
    
    // Sauvegarder les éléments de la page actuelle (en format JSON)
    if (this.G_cCurrentPage) {
        this.G_cCurrentPage.elements = this.G_lElements.map(e => {
            // Vérifier si c'est déjà un objet JSON ou une instance C_Element
            if (typeof e.F_cToJSON === 'function') {
                return e.F_cToJSON();
            }
            return e; // Déjà au format JSON
        });
    }
    
    // Charger les éléments de la nouvelle page
    this.G_cCurrentPage = page;
    this.G_sSelectedPageId = pageId;
    
    // S'assurer que page.elements existe et est un tableau
    if (!page.elements || !Array.isArray(page.elements)) {
        page.elements = [];
    }
    
    // Convertir les éléments JSON en instances C_Element
    this.G_lElements = page.elements.map(elemData => C_Element.F_cFromJSON(elemData));
    
    // Synchroniser navigationActions depuis m_cNavigationLinks
    this.G_lElements.forEach(element => {
        if (element.m_cNavigationLinks && element.m_cNavigationLinks.length > 0) {
            if (!element.attributes.navigationActions) {
                element.attributes.navigationActions = {
                    onClick: null,
                    onDoubleClick: null,
                    onLoad: null
                };
            }
            
            element.m_cNavigationLinks.forEach(link => {
                const actionMap = {
                    'click': 'onClick',
                    'dblclick': 'onDoubleClick',
                    'load': 'onLoad'
                };
                const actionKey = actionMap[link.action];
                if (actionKey) {
                    element.attributes.navigationActions[actionKey] = link.targetPage;
                }
            });
        }
    });
    
    this.G_cSelectedElement = null;
    
    // Mettre à jour l'affichage
    this.f_vRenderAll();
    this.f_vRenderTree();
    this.f_vRenderPagesList();
    
    // Appliquer les liens de navigation aux éléments
    this.f_vApplyNavigationLinks();
    
    if (!silent) {
        this.f_vShowToast(`Page "${page.title}" chargée (${this.G_lElements.length} éléments)`, 'info', 2000);
    }
};

// Supprimer une page
C_App.prototype.f_vDeletePage = function(pageId) {
    const page = this.G_lPages.find(p => p.id === pageId);
    if (!page) return;

    this.f_vConfirm(
        `Êtes-vous sûr de vouloir supprimer la page "${page.title}" ?<br>Tous les éléments de cette page seront perdus.`,
        () => {
            const deletingCurrent = this.G_cCurrentPage && this.G_cCurrentPage.id === pageId;

            // Supprimer la page de la liste
            this.G_lPages = this.G_lPages.filter(p => p.id !== pageId);

            // Réinitialiser les références de sélection si besoin
            if (this.G_sSelectedPageId === pageId) {
                this.G_sSelectedPageId = null;
            }
            if (this.G_cPagePropertiesShown && this.G_cPagePropertiesShown.id === pageId) {
                this.G_cPagePropertiesShown = null;
                const propertiesPanel = document.getElementById('G_sProperties');
                if (propertiesPanel) {
                    propertiesPanel.innerHTML = '<div class="c-properties-empty">Sélectionnez une page pour afficher ses propriétés.</div>';
                }
            }

            if (this.G_lPages.length === 0) {
                // Plus aucune page : vider le workspace et notifier l'utilisateur
                this.G_cCurrentPage = null;
                this.G_lElements = [];
                this.G_cSelectedElement = null;
                this.G_lSelectedElements = [];

                this.f_vRenderAll();
                this.f_vRenderTree();
                this.f_vRenderPagesList();

                this.f_vShowToast('Toutes les pages ont été supprimées. Créez-en une nouvelle pour continuer.', 'info', 2500);
                return;
            }

            if (deletingCurrent) {
                const nextPage = this.G_lPages[0];
                this.f_vLoadPage(nextPage.id, null, true);
                this.f_vShowToast('Page supprimée', 'info', 2000);
            } else {
                this.f_vRenderPagesList();
                this.f_vShowToast('Page supprimée', 'info', 2000);
            }
        },
        'Supprimer la page'
    );
};

// ========== ACTIONS SUR LES COMPOSANTS ==========

// Ajouter une action de navigation à un élément
C_App.prototype.f_vShowNavigationActions = function(element) {
    if (!element || !element.attributes) return '';
    
    // Initialiser les actions si nécessaire
    if (!element.attributes.navigationActions) {
        element.attributes.navigationActions = {
            onClick: null,
            onDoubleClick: null,
            onLoad: null
        };
    }
    
    let actionsHTML = '<div class="c-property-section">';
    actionsHTML += '<h4>🔗 Actions de navigation</h4>';
    
    // Action au clic
    actionsHTML += '<div class="c-property-group">';
    actionsHTML += '<label>Au clic (click)</label>';
    actionsHTML += '<select onchange="G_cApp.f_vSetNavigationAction(\'' + element.id + '\', \'onClick\', this.value)">';
    actionsHTML += '<option value="">Aucune action</option>';
    this.G_lPages.forEach(page => {
        const selected = element.attributes.navigationActions.onClick === page.id ? 'selected' : '';
        actionsHTML += `<option value="${page.id}" ${selected}>${page.icon} ${page.title} (${page.route})</option>`;
    });
    actionsHTML += '</select>';
    actionsHTML += '</div>';
    
    // Action au double-clic
    actionsHTML += '<div class="c-property-group">';
    actionsHTML += '<label>Au double-clic (dblclick)</label>';
    actionsHTML += '<select onchange="G_cApp.f_vSetNavigationAction(\'' + element.id + '\', \'onDoubleClick\', this.value)">';
    actionsHTML += '<option value="">Aucune action</option>';
    this.G_lPages.forEach(page => {
        const selected = element.attributes.navigationActions.onDoubleClick === page.id ? 'selected' : '';
        actionsHTML += `<option value="${page.id}" ${selected}>${page.icon} ${page.title} (${page.route})</option>`;
    });
    actionsHTML += '</select>';
    actionsHTML += '</div>';
    
    // Action au chargement
    actionsHTML += '<div class="c-property-group">';
    actionsHTML += '<label>Au chargement (onload)</label>';
    actionsHTML += '<select onchange="G_cApp.f_vSetNavigationAction(\'' + element.id + '\', \'onLoad\', this.value)">';
    actionsHTML += '<option value="">Aucune action</option>';
    this.G_lPages.forEach(page => {
        const selected = element.attributes.navigationActions.onLoad === page.id ? 'selected' : '';
        actionsHTML += `<option value="${page.id}" ${selected}>${page.icon} ${page.title} (${page.route})</option>`;
    });
    actionsHTML += '</select>';
    actionsHTML += '</div>';
    
    actionsHTML += '</div>';
    
    return actionsHTML;
};

// Définir une action de navigation
C_App.prototype.f_vSetNavigationAction = function(elementId, eventType, pageId) {
    const element = typeof this.f_cFindElementById === 'function'
        ? this.f_cFindElementById(elementId)
        : this.G_lElements.find(e => e.id === elementId);
    if (!element) return;

    if (!element.attributes) {
        element.attributes = {};
    }
    if (!element.attributes.navigationActions) {
        element.attributes.navigationActions = {
            onClick: null,
            onDoubleClick: null,
            onLoad: null
        };
    }
    
    // Initialiser m_cNavigationLinks si nécessaire
    if (!element.m_cNavigationLinks) {
        element.m_cNavigationLinks = [];
    }
    
    // Mapper les types d'événements
    const actionMap = {
        'onClick': 'click',
        'onDoubleClick': 'dblclick',
        'onLoad': 'load'
    };
    
    const action = actionMap[eventType];
    
    // Mettre à jour navigationActions
    element.attributes.navigationActions[eventType] = pageId || null;
    
    // Synchroniser avec m_cNavigationLinks
    if (pageId) {
        // Supprimer l'ancien lien pour cette action s'il existe
        element.m_cNavigationLinks = element.m_cNavigationLinks.filter(link => link.action !== action);
        
        // Ajouter le nouveau lien
        element.m_cNavigationLinks.push({
            targetPage: pageId,
            action: action
        });
    } else {
        // Supprimer le lien pour cette action
        element.m_cNavigationLinks = element.m_cNavigationLinks.filter(link => link.action !== action);
    }
    
    // Sauvegarder dans la page courante
    if (this.G_cCurrentPage) {
        const pageElement = this.f_cFindElementDataById
            ? this.f_cFindElementDataById(this.G_cCurrentPage.elements, elementId)
            : this.G_cCurrentPage.elements.find(e => e && e.id === elementId);
        if (pageElement) {
            // Synchroniser navigationActions
            if (!pageElement.attributes) {
                pageElement.attributes = {};
            }
            if (!pageElement.attributes.navigationActions) {
                pageElement.attributes.navigationActions = {
                    onClick: null,
                    onDoubleClick: null,
                    onLoad: null
                };
            }
            pageElement.attributes.navigationActions[eventType] = pageId || null;
            
            // Synchroniser m_cNavigationLinks
            if (!pageElement.m_cNavigationLinks) {
                pageElement.m_cNavigationLinks = [];
            }
            if (pageId) {
                pageElement.m_cNavigationLinks = pageElement.m_cNavigationLinks.filter(link => link.action !== action);
                pageElement.m_cNavigationLinks.push({
                    targetPage: pageId,
                    action: action
                });
            } else {
                pageElement.m_cNavigationLinks = pageElement.m_cNavigationLinks.filter(link => link.action !== action);
            }
        }
        
        // Sauvegarder les éléments
        this.G_cCurrentPage.elements = this.G_lElements.map(e =>
            typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
        );
    }
    
    // Rafraîchir le graphe si ouvert
    if (window.G_cGraphVisualizer) {
        window.G_cGraphVisualizer.F_vGenerateNodesFromPages();
        window.G_cGraphVisualizer.F_vDraw();
    }

    this.f_vApplyNavigationLinks();
    
    this.f_vSaveHistory();
    
    const actionName = {
        onClick: 'clic',
        onDoubleClick: 'double-clic',
        onLoad: 'chargement'
    }[eventType];
    
    if (pageId) {
        const page = this.G_lPages.find(p => p.id === pageId);
        this.f_vShowToast(`Action "${actionName}" → ${page.title}`, 'success', 2000);
    } else {
        this.f_vShowToast(`Action "${actionName}" supprimée`, 'info', 1500);
    }
};

// ========== FRAMEWORK DE NAVIGATION (Runtime) ==========

// Fonction à exporter dans le code généré pour naviguer entre les pages
C_App.prototype.f_sGetNavigationFramework = function() {
    const f_sComputeExportPath = (page) => {
        const isMain = !!page.isMainPage;
        if (isMain) {
            return 'index.html';
        }

        const rawRoute = (page.route || '').trim();
        const routeSegments = rawRoute
            .split('/')
            .map(segment => segment.trim())
            .filter(segment => segment.length > 0);

        const safeSegments = routeSegments.length > 0
            ? routeSegments
            : ['home'];

        return 'pages/' + safeSegments.join('/') + '/index.html';
    };

    const l_sPagesJSON = JSON.stringify(this.G_lPages.map(p => ({
        id: p.id,
        title: p.title,
        route: p.route,
        meta: p.meta,
        isMainPage: !!p.isMainPage,
        exportPath: f_sComputeExportPath(p)
    })));

    return `
// Framework de navigation
const PageRouter = {
    pages: ${l_sPagesJSON},
    currentPage: null,

    // Naviguer vers une page par ID
    F_vGoToPage: function(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        if (!page) {
            console.error('Page non trouvée:', pageId);
            return;
        }

        this.currentPage = page;

        const exportPrefix = typeof window !== 'undefined' ? window.__PAGE_EXPORT_PREFIX : undefined;
        if (typeof window !== 'undefined' && exportPrefix !== undefined && page.exportPath) {
            const targetHref = exportPrefix + page.exportPath;
            window.location.href = targetHref;
            return;
        }

        // Mettre à jour le titre
        document.title = page.title;

        // Mettre à jour les meta tags
        this.f_vUpdateMetaTags(page);

        // Déclencher un événement personnalisé
        const event = new CustomEvent('pagechange', {
            detail: { page: page }
        });
        window.dispatchEvent(event);

        // Dans une vraie app, charger le contenu de la page
        console.log('Navigation vers:', page.route);
    },

    // Naviguer vers une route
    F_vGoToRoute: function(route) {
        const page = this.pages.find(p => p.route === route);
        if (page) {
            this.F_vGoToPage(page.id);
        }
    },

    // Mettre à jour les meta tags
    f_vUpdateMetaTags: function(page) {
        if (!page || !page.meta) {
            return;
        }

        // Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = page.meta.description || '';

        // Keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.content = page.meta.keywords || '';
    }
};

// Exposer globalement
window.PageRouter = PageRouter;
window.F_vGoToPage = PageRouter.F_vGoToPage.bind(PageRouter);
window.F_vGoToRoute = PageRouter.F_vGoToRoute.bind(PageRouter);
if (typeof window !== 'undefined' && window.__PAGE_ID) {
    const l_cInitialPage = PageRouter.pages.find(p => p.id === window.__PAGE_ID);
    if (l_cInitialPage) {
        PageRouter.currentPage = l_cInitialPage;
    }
}
`;
};

// ========== DEMO / EXEMPLE ==========

// Créer un projet de démonstration avec plusieurs pages
C_App.prototype.f_vCreateMultiPageDemo = function() {
    this.f_vConfirm(
        'Voulez-vous créer un projet de démonstration multi-pages ?<br>Cela remplacera votre projet actuel.',
        () => {
            // Vider le projet actuel
            this.G_lElements = [];
            this.G_lPages = [];
            this.G_iPageCounter = 0;
            
            // Créer les pages
            const homePage = {
                id: 'page_' + (++this.G_iPageCounter),
                title: 'Accueil',
                route: '/',
                icon: '🏠',
                elements: [],
                meta: {
                    description: 'Page d\'accueil de notre site',
                    keywords: 'accueil, home, bienvenue'
                }
            };
            
            const servicesPage = {
                id: 'page_' + (++this.G_iPageCounter),
                title: 'Services',
                route: '/services',
                icon: '💼',
                elements: [],
                meta: {
                    description: 'Nos services et prestations',
                    keywords: 'services, prestations, offres'
                }
            };
            
            const contactPage = {
                id: 'page_' + (++this.G_iPageCounter),
                title: 'Contact',
                route: '/contact',
                icon: '📧',
                elements: [],
                meta: {
                    description: 'Contactez-nous',
                    keywords: 'contact, email, formulaire'
                }
            };
            
            this.G_lPages = [homePage, servicesPage, contactPage];
            this.G_cCurrentPage = homePage;
            
            // Créer un header avec navigation
            const header = this.f_cCreateDemoElement('div', {
                innerHTML: '',
                style: {
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }
            });
            
            // Boutons de navigation
            const btnHome = this.f_cCreateDemoElement('button', {
                innerHTML: '🏠 Accueil',
                style: {
                    padding: '12px 24px',
                    background: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                },
                navigationActions: {
                    onClick: homePage.id,
                    onDoubleClick: null,
                    onLoad: null
                }
            });
            
            const btnServices = this.f_cCreateDemoElement('button', {
                innerHTML: '💼 Services',
                style: {
                    padding: '12px 24px',
                    background: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                },
                navigationActions: {
                    onClick: servicesPage.id,
                    onDoubleClick: null,
                    onLoad: null
                }
            });
            
            const btnContact = this.f_cCreateDemoElement('button', {
                innerHTML: '📧 Contact',
                style: {
                    padding: '12px 24px',
                    background: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                },
                navigationActions: {
                    onClick: contactPage.id,
                    onDoubleClick: null,
                    onLoad: null
                }
            });
            
            header.children = [btnHome, btnServices, btnContact];
            this.G_lElements.push(header);
            
            // Contenu de la page d'accueil
            const homeContent = this.f_cCreateDemoElement('div', {
                innerHTML: '<h1>Bienvenue sur notre site !</h1><p>Explorez nos services et contactez-nous.</p>',
                style: {
                    padding: '60px 20px',
                    textAlign: 'center',
                    fontSize: '18px'
                }
            });
            this.G_lElements.push(homeContent);
            
            // Sauvegarder les éléments de la page d'accueil
            homePage.elements = [...this.G_lElements];
            
            // Charger la page Services
            this.G_lElements = [];
            
            // Header aussi sur Services
            const headerServices = JSON.parse(JSON.stringify(header));
            this.G_lElements.push(this.f_cRecreateElementFromJSON(headerServices));
            
            const servicesContent = this.f_cCreateDemoElement('div', {
                innerHTML: '<h1>Nos Services</h1><p>Découvrez toutes nos prestations professionnelles.</p>',
                style: {
                    padding: '60px 20px',
                    textAlign: 'center',
                    fontSize: '18px'
                }
            });
            this.G_lElements.push(servicesContent);
            
            servicesPage.elements = [...this.G_lElements];
            
            // Charger la page Contact
            this.G_lElements = [];
            
            const headerContact = JSON.parse(JSON.stringify(header));
            this.G_lElements.push(this.f_cRecreateElementFromJSON(headerContact));
            
            const contactContent = this.f_cCreateDemoElement('div', {
                innerHTML: '<h1>Contactez-nous</h1><p>Nous sommes à votre écoute !</p>',
                style: {
                    padding: '60px 20px',
                    textAlign: 'center',
                    fontSize: '18px'
                }
            });
            this.G_lElements.push(contactContent);
            
            contactPage.elements = [...this.G_lElements];
            
            // Revenir à la page d'accueil
            this.f_vLoadPage(homePage.id);
            
            this.f_vShowToast('Projet de démonstration créé !', 'success', 3000);
        },
        'Créer la démo'
    );
};

// Fonction utilitaire pour créer un élément de démo
C_App.prototype.f_cCreateDemoElement = function(type, attrs) {
    const element = new C_Element('el-' + (++this.G_iCounter), type, null);
    if (attrs.innerHTML) element.attributes.innerHTML = attrs.innerHTML;
    if (attrs.className) element.attributes.className = attrs.className;
    if (attrs.style) element.attributes.style = attrs.style;
    if (attrs.navigationActions) element.attributes.navigationActions = attrs.navigationActions;
    return element;
};

// Recréer un élément depuis JSON
C_App.prototype.f_cRecreateElementFromJSON = function(json) {
    return C_Element.F_cFromJSON(json);
};

// Appliquer les liens de navigation aux éléments de la page actuelle
C_App.prototype.f_vApplyNavigationLinks = function() {
    if (!this.G_cCurrentPage || !this.G_cCurrentPage.elements) return;

    const l_cElementsQueue = [];
    const f_vCollectElements = (p_lElements) => {
        if (!Array.isArray(p_lElements)) return;
        p_lElements.forEach(elem => {
            if (!elem) return;
            l_cElementsQueue.push(elem);
            if (elem.children && elem.children.length > 0) {
                f_vCollectElements(elem.children);
            }
        });
    };

    f_vCollectElements(this.G_cCurrentPage.elements);

    l_cElementsQueue.forEach(elemData => {
        if (!elemData || !elemData.id) return;

        const hasNavigation = Array.isArray(elemData.m_cNavigationLinks) && elemData.m_cNavigationLinks.length > 0;
        const originalElement = document.getElementById(elemData.id);
        if (!originalElement) return;

        const hadNavigationBefore = originalElement.hasAttribute('data-nav-link');
        if (!hasNavigation && !hadNavigationBefore) {
            return;
        }

        let domElement = originalElement;
        if (originalElement.parentNode) {
            const clonedElement = originalElement.cloneNode(true);
            originalElement.parentNode.replaceChild(clonedElement, originalElement);
            domElement = clonedElement;
        }

        domElement.removeAttribute('data-nav-link');
        if (domElement.title && domElement.title.startsWith('Navigation:')) {
            domElement.removeAttribute('title');
        }
        if (!hasNavigation) {
            return;
        }

        const labels = [];
        let pointerNeeded = false;

        elemData.m_cNavigationLinks.forEach(link => {
            if (!link || !link.targetPage) return;
            const targetPage = this.G_lPages.find(p => p.id === link.targetPage);
            if (!targetPage) return;

            if (link.action === 'click') {
                domElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.f_vLoadPage(link.targetPage);
                });
                pointerNeeded = true;
            } else if (link.action === 'dblclick') {
                domElement.addEventListener('dblclick', (e) => {
                    e.preventDefault();
                    this.f_vLoadPage(link.targetPage);
                });
                pointerNeeded = true;
            } else if (link.action === 'load') {
                setTimeout(() => {
                    this.f_vLoadPage(link.targetPage);
                }, 100);
            }

            labels.push(`${link.action} → ${targetPage.title}`);
        });

        if (pointerNeeded) {
            domElement.style.cursor = 'pointer';
        }

        if (labels.length > 0) {
            const labelText = labels.join(' | ');
            domElement.setAttribute('data-nav-link', labelText);
            domElement.title = `Navigation: ${labelText}`;
        }
    });
};

C_App.prototype.f_cFindElementDataById = function(p_lElements, p_sId) {
    if (!Array.isArray(p_lElements) || !p_sId) {
        return null;
    }

    for (const element of p_lElements) {
        if (!element) continue;
        if (element.id === p_sId) {
            return element;
        }
        const childResult = this.f_cFindElementDataById(element.children || [], p_sId);
        if (childResult) {
            return childResult;
        }
    }

    return null;
};
