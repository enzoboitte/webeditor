class C_App {
    constructor() {
        this.G_lElements = [];
        this.G_cSelectedElement = null;
        this.G_lSelectedElements = []; // Multi-sélection
        this.G_lClipboard = []; // Presse-papiers pour copier/coller
        this.G_iCounter = 0;
        this.G_cDraggedComponent = null;
        this.G_cDraggedTemplate = null;
        this.G_cDraggedCustomComponent = null; // Composant personnalisé en cours de drag
        this.G_cDraggedElement = null;
        this.G_cDraggedTreeElement = null;
        this.G_cAPI = new C_APIFramework();
        this.G_bIsDragging = false;
        this.G_bIsResizing = false;
        this.G_cDragOffset = {x: 0, y: 0};
        this.G_lComponentTemplates = [];
        this.G_sActiveTab = 'components';
        this.G_bCSSRawMode = false; // Mode texte brut pour le CSS
        this.G_bAbsoluteMode = true; // Mode absolute (true) ou flow (false)
        this.G_cCollapsedTreeItems = new Set(); // Éléments pliés dans l'arborescence
        this.G_fZoom = 0.5; // Niveau de zoom (dézoom léger par défaut)
        this.G_cPanOffset = {x: 0, y: 0}; // Offset pour le pan
        this.G_bIsPanning = false; // Mode pan actif
        
        // Nouvelles fonctionnalités
        this.G_bGridEnabled = false; // Grille magnétique
        this.G_iGridSize = 20; // Taille de la grille
        this.G_sCurrentBreakpoint = 'desktop'; // Mode responsive
        this.G_iResponsiveWidth = null; // Largeur du breakpoint actif
        this.G_sEditorTheme = 'dark'; // Thème de l'éditeur
        this.G_cDesignTokens = { // Design tokens
            colors: [],
            typography: [],
            spacing: []
        };
        this.G_cCSSVariables = {}; // Variables CSS globales
        this.G_sActiveRightTab = 'properties'; // Onglet actif du panneau droit
        
        // Système de pages
        this.G_lPages = []; // Liste des pages
        this.G_cCurrentPage = null; // Page active
        this.G_iPageCounter = 0; // Compteur pour générer les IDs de page
        
        // Mode création de composants
        this.G_bComponentCreationMode = false; // Mode création de composant
        this.G_lCustomComponents = []; // Liste des composants créés
        this.G_cCurrentComponent = null; // Composant en cours d'édition
        this.G_iComponentCounter = 0; // Compteur pour les composants
        this.G_lElementsBackup = null; // Sauvegarde des éléments avant mode composant
        
        // Historique pour undo/redo
        this.G_lHistory = [];
        this.G_iHistoryIndex = -1;
        this.G_bIsRestoringHistory = false;
        
        // Créer un élément virtuel pour le body
        this.G_cBodyElement = {
            id: 'body',
            type: 'body',
            attributes: {
                style: {
                    background: '#ffffff'
                },
                className: ''
            },
            pseudoStyles: {
                hover: {},
                active: {},
                focus: {},
                before: {},
                after: {}
            },
            isVirtual: true
        };
        
        this.f_vInit();
    }

    async f_vInit() {
        this.f_vLoadCustomComponents(); // Charger les composants personnalisés AVANT les templates
        await this.f_vLoadComponentTemplates();
        this.f_vRenderComponentLibrary(); // Maintenant, la bibliothèque inclura les composants personnalisés
        this.f_vSetupDragDrop();
        this.f_vSetupCanvas();
        this.f_vSetupFileInput();
        this.f_vSetupKeyboardShortcuts();
        this.f_vSetupPanelResizer();
        this.f_vUpdateElementCount();
        this.f_vRenderTree(); // Afficher l'arborescence au chargement
        this.f_vSelectBody(); // Sélectionner le body par défaut
        this.f_vSaveHistory(); // Sauvegarder l'état initial
        this.f_vInitPages(); // Initialiser le système de pages
        
        // Réinitialiser le toggle du mode composant au chargement
        const toggleCheckbox = document.getElementById('G_sComponentModeToggle');
        if(toggleCheckbox) {
            toggleCheckbox.checked = false;
        }
        this.G_bComponentCreationMode = false;

        // Appliquer le dézoom initial après l'initialisation (centré sur le workspace)
        this.f_vApplyInitialZoom();
    }

    // ========== SYSTÈME DE POPUPS MODERNES ==========
    f_vShowPopup(p_cOptions) {
        const { 
            title = 'Information', 
            message = '', 
            type = 'info', // info, success, warning, error
            buttons = [{ text: 'OK', type: 'primary', action: null }],
            onClose = null
        } = p_cOptions;

        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.className = 'c-popup-overlay';

        // Icônes selon le type
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        // Créer la popup
        const popup = document.createElement('div');
        popup.className = 'c-popup';
        popup.innerHTML = `
            <div class="c-popup-header">
                <div class="c-popup-icon ${type}">${icons[type]}</div>
                <div class="c-popup-title">${title}</div>
            </div>
            <div class="c-popup-body">${message}</div>
            <div class="c-popup-footer" id="popup-footer"></div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Ajouter les boutons
        const footer = popup.querySelector('#popup-footer');
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `c-popup-btn c-popup-btn-${btn.type || 'secondary'}`;
            button.textContent = btn.text;
            button.onclick = () => {
                this.f_vClosePopup(overlay, () => {
                    if(btn.action) btn.action();
                    if(onClose) onClose(btn.text);
                });
            };
            footer.appendChild(button);
        });

        // Fermer avec Escape
        const handleEscape = (e) => {
            if(e.key === 'Escape') {
                this.f_vClosePopup(overlay, onClose);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Fermer en cliquant sur l'overlay
        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) {
                this.f_vClosePopup(overlay, onClose);
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }

    f_vClosePopup(p_cOverlay, p_fCallback) {
        p_cOverlay.classList.add('c-popup-closing');
        setTimeout(() => {
            p_cOverlay.remove();
            if(p_fCallback) p_fCallback();
        }, 200);
    }

    // Méthodes de commodité
    f_vAlert(p_sMessage, p_sTitle = 'Information') {
        this.f_vShowPopup({
            title: p_sTitle,
            message: p_sMessage,
            type: 'info',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }

    f_vAlertSuccess(p_sMessage, p_sTitle = 'Succès') {
        this.f_vShowPopup({
            title: p_sTitle,
            message: p_sMessage,
            type: 'success',
            buttons: [{ text: 'OK', type: 'success' }]
        });
    }

    f_vAlertError(p_sMessage, p_sTitle = 'Erreur') {
        this.f_vShowPopup({
            title: p_sTitle,
            message: p_sMessage,
            type: 'error',
            buttons: [{ text: 'OK', type: 'danger' }]
        });
    }

    f_vAlertWarning(p_sMessage, p_sTitle = 'Attention') {
        this.f_vShowPopup({
            title: p_sTitle,
            message: p_sMessage,
            type: 'warning',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }

    f_vConfirm(p_sMessage, p_fOnConfirm, p_sTitle = 'Confirmation') {
        this.f_vShowPopup({
            title: p_sTitle,
            message: p_sMessage,
            type: 'warning',
            buttons: [
                { text: 'Annuler', type: 'secondary' },
                { text: 'Confirmer', type: 'primary', action: p_fOnConfirm }
            ]
        });
    }

    f_vPrompt(p_sMessage, p_fOnSubmit, p_sDefaultValue = '', p_sTitle = 'Saisie', p_sPlaceholder = '') {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.className = 'c-popup-overlay';

        // Créer la popup
        const popup = document.createElement('div');
        popup.className = 'c-popup';
        popup.innerHTML = `
            <div class="c-popup-header">
                <div class="c-popup-icon info">✏️</div>
                <div class="c-popup-title">${p_sTitle}</div>
            </div>
            <div class="c-popup-body">
                <p style="margin-bottom: 12px;">${p_sMessage}</p>
                <input type="text" id="popup-input" class="c-popup-input" 
                       value="${p_sDefaultValue}" 
                       placeholder="${p_sPlaceholder}"
                       style="width: 100%; padding: 10px; border: 1px solid #404040; border-radius: 6px; background: #1e1e1e; color: #fff; font-size: 14px;">
            </div>
            <div class="c-popup-footer">
                <button class="c-popup-btn c-popup-btn-secondary" id="popup-cancel">Annuler</button>
                <button class="c-popup-btn c-popup-btn-primary" id="popup-submit">Valider</button>
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        const input = popup.querySelector('#popup-input');
        const cancelBtn = popup.querySelector('#popup-cancel');
        const submitBtn = popup.querySelector('#popup-submit');

        // Focus sur l'input
        setTimeout(() => input.focus(), 100);

        // Soumettre avec Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitBtn.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelBtn.click();
            }
        });

        // Bouton annuler
        cancelBtn.onclick = () => {
            this.f_vClosePopup(overlay);
        };

        // Bouton valider
        submitBtn.onclick = () => {
            const value = input.value.trim();
            this.f_vClosePopup(overlay, () => {
                if (value && p_fOnSubmit) {
                    p_fOnSubmit(value);
                }
            });
        };

        // Fermer avec Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.f_vClosePopup(overlay);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // ========== SYSTÈME DE TOAST (NOTIFICATIONS LÉGÈRES) ==========
    f_vShowToast(p_sMessage, p_sType = 'info', p_iDuration = 3000) {
        // Créer le conteneur de toasts s'il n'existe pas
        let container = document.querySelector('.c-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'c-toast-container';
            document.body.appendChild(container);
        }

        // Icônes selon le type
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        // Créer le toast
        const toast = document.createElement('div');
        toast.className = `c-toast ${p_sType}`;
        toast.innerHTML = `
            <div class="c-toast-icon">${icons[p_sType]}</div>
            <div class="c-toast-message">${p_sMessage}</div>
        `;

        container.appendChild(toast);

        // Auto-fermeture
        setTimeout(() => {
            toast.classList.add('c-toast-closing');
            setTimeout(() => toast.remove(), 300);
        }, p_iDuration);
    }



    f_vSetupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignorer si on est dans un input/textarea
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Ctrl+Z pour Undo
            if((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.f_vUndo();
                return;
            }
            
            // Ctrl+Shift+Z pour Redo
            if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.f_vRedo();
                return;
            }
            
            // Ctrl/Cmd + Shift + Lettre pour ajouter des composants
            if((e.ctrlKey || e.metaKey) && e.shiftKey) {
                let componentType = null;
                
                switch(e.key.toLowerCase()) {
                    case 'd': componentType = 'div'; break;
                    case 'b': componentType = 'button'; break;
                    case 'i': componentType = 'input'; break;
                    case 't': componentType = 'textarea'; break;
                    case 'p': componentType = 'p'; break;
                    case 'h': componentType = 'h1'; break;
                    case 'f': componentType = 'form'; break;
                    case 'a': componentType = 'a'; break;
                    case 'l': componentType = 'ul'; break;
                }
                
                if(componentType) {
                    e.preventDefault();
                    this.f_vAddComponentByType(componentType);
                }
            }
            
            // Delete pour supprimer l'élément sélectionné ou les éléments multi-sélectionnés
            if(e.key === 'Delete' && (this.G_cSelectedElement || this.G_lSelectedElements.length > 0)) {
                e.preventDefault();
                this.F_vDeleteElement();
            }
            
            // Ctrl/Cmd + A pour sélectionner tous les éléments
            if((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.f_vSelectAll();
            }
            
            // Ctrl/Cmd + C pour copier
            if((e.ctrlKey || e.metaKey) && e.key === 'c' && (this.G_cSelectedElement || this.G_lSelectedElements.length > 0)) {
                e.preventDefault();
                this.f_vCopyElements();
            }
            
            // Ctrl/Cmd + V pour coller
            if((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                this.f_vPasteElements();
            }
            
            // Ctrl/Cmd + D pour dupliquer
            if((e.ctrlKey || e.metaKey) && e.key === 'd' && this.G_cSelectedElement) {
                e.preventDefault();
                this.f_vDuplicateElement();
            }
            
            // Ctrl/Cmd + Z pour undo (à implémenter plus tard)
            // Ctrl/Cmd + Y pour redo (à implémenter plus tard)
            
            // Flèches pour déplacer l'élément sélectionné ou les éléments multi-sélectionnés
            if((this.G_cSelectedElement || this.G_lSelectedElements.length > 0) && 
               ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                
                // Shift = déplacement de 10px, normal = 1px
                const step = e.shiftKey ? 10 : 1;
                
                // Déplacer les éléments multi-sélectionnés
                if(this.G_lSelectedElements.length > 0) {
                    this.G_lSelectedElements.forEach(element => {
                        let currentLeft = parseInt(element.attributes.style.left) || 0;
                        let currentTop = parseInt(element.attributes.style.top) || 0;
                        
                        switch(e.key) {
                            case 'ArrowLeft':
                                currentLeft -= step;
                                break;
                            case 'ArrowRight':
                                currentLeft += step;
                                break;
                            case 'ArrowUp':
                                currentTop -= step;
                                break;
                            case 'ArrowDown':
                                currentTop += step;
                                break;
                        }
                        
                        element.attributes.style.left = currentLeft + 'px';
                        element.attributes.style.top = currentTop + 'px';
                    });
                    this.f_vHideSnapGuides();
                } else if(this.G_cSelectedElement) {
                    // Déplacer l'élément unique sélectionné
                    let currentLeft = parseInt(this.G_cSelectedElement.attributes.style.left) || 0;
                    let currentTop = parseInt(this.G_cSelectedElement.attributes.style.top) || 0;
                    
                    switch(e.key) {
                        case 'ArrowLeft':
                            currentLeft -= step;
                            break;
                        case 'ArrowRight':
                            currentLeft += step;
                            break;
                        case 'ArrowUp':
                            currentTop -= step;
                            break;
                        case 'ArrowDown':
                            currentTop += step;
                            break;
                    }
                    
                    // Détecter les snaps pour afficher les guides (sans bloquer la position)
                    const snapResult = this.f_cSnapToElements(this.G_cSelectedElement, currentLeft, currentTop);
                    
                    // Afficher temporairement les guides si des alignements sont détectés
                    if (snapResult.guides && snapResult.guides.length > 0) {
                        setTimeout(() => {
                            this.f_vShowSnapGuides(snapResult.guides);
                            setTimeout(() => this.f_vHideSnapGuides(), 500);
                        }, 10);
                    } else {
                        this.f_vHideSnapGuides();
                    }
                    
                    // Appliquer la nouvelle position (sans snap, juste le déplacement)
                    this.G_cSelectedElement.attributes.style.left = currentLeft + 'px';
                    this.G_cSelectedElement.attributes.style.top = currentTop + 'px';
                    
                    this.f_vUpdateCSSEditor();
                }
                
                this.f_vSaveHistory();
                this.f_vRenderAll();
            }
        });
    }

    f_vAddComponentByType(p_sType) {
        const l_sId = 'el-' + this.G_iCounter++;
        const l_cElement = new C_Element(p_sType, l_sId);
        
        // Positionner au centre de l'écran
        const workspace = document.getElementById('G_sWorkspace');
        const rect = workspace.getBoundingClientRect();
        l_cElement.attributes.style.left = (rect.width / 2 - 50) + 'px';
        l_cElement.attributes.style.top = (rect.height / 2 - 25) + 'px';
        l_cElement.attributes.style.position = 'absolute';
        
        this.G_lElements.push(l_cElement);
        
        // Sauvegarder dans la page courante
        if (this.G_cCurrentPage) {
            this.G_cCurrentPage.elements = this.G_lElements.map(e =>
                typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
            );
        }
        
        this.f_vSaveHistory(); // Sauvegarder dans l'historique
        this.f_vRenderAll();
        this.F_vSelectElement(l_cElement);
        
        // Rafraîchir les propriétés de page si affichées
        if (this.f_vRefreshPageProperties) {
            this.f_vRefreshPageProperties();
        }

        // Rafraîchir le graph si ouvert
        if (window.G_cGraphVisualizer && document.getElementById('G_sGraphPopup').style.display === 'flex') {
            window.G_cGraphVisualizer.F_vRefresh();
        }
    }

    f_vDuplicateElement() {
        if(!this.G_cSelectedElement) return;
        
        const jsonData = this.G_cSelectedElement.F_cToJSON();
        const clonedData = this.f_cCloneJSONWithNewIds(jsonData);
        
        const l_cNewElement = C_Element.F_cFromJSON(clonedData);
        
        // Décaler légèrement
        const currentLeft = parseInt(l_cNewElement.attributes.style.left) || 0;
        const currentTop = parseInt(l_cNewElement.attributes.style.top) || 0;
        l_cNewElement.attributes.style.left = (currentLeft + 20) + 'px';
        l_cNewElement.attributes.style.top = (currentTop + 20) + 'px';
        
        // Ajouter au même niveau
        if(this.G_cSelectedElement.parent) {
            this.G_cSelectedElement.parent.F_vAddChild(l_cNewElement);
        } else {
            this.G_lElements.push(l_cNewElement);
        }
        
        this.f_vSaveHistory(); // Sauvegarder dans l'historique
        this.f_vRenderAll();
        this.F_vSelectElement(l_cNewElement);
        
        // Rafraîchir les propriétés de page si affichées
        if (this.f_vRefreshPageProperties) {
            this.f_vRefreshPageProperties();
        }
    }
    
    f_vSelectAll() {
        // Sélectionner tous les éléments racine
        this.G_lSelectedElements = [...this.G_lElements];
        
        // Désélectionner l'élément unique
        if(this.G_cSelectedElement) {
            const domElement = document.getElementById(this.G_cSelectedElement.id);
            if(domElement) {
                domElement.classList.remove('selected');
            }
            this.G_cSelectedElement = null;
        }
        
        // Appliquer le style multi-sélection
        this.G_lSelectedElements.forEach(element => {
            const domElement = document.getElementById(element.id);
            if(domElement) {
                domElement.classList.add('multi-selected');
            }
        });
        
        // Cacher le panneau de propriétés
        document.getElementById('G_sProperties').style.display = 'none';
    }
    
    f_vCopyElements() {
        // Copier les éléments sélectionnés
        if(this.G_lSelectedElements.length > 0) {
            this.G_lClipboard = this.G_lSelectedElements.map(el => el.F_cToJSON());
        } else if(this.G_cSelectedElement) {
            this.G_lClipboard = [this.G_cSelectedElement.F_cToJSON()];
        }
    }
    
    f_vPasteElements() {
        if(this.G_lClipboard.length === 0) return;
        
        // Désélectionner tout
        this.f_vDeselectAll();
        
        const l_lNewElements = [];
        
        // Coller et décaler chaque élément
        this.G_lClipboard.forEach((jsonData, index) => {
            const clonedData = this.f_cCloneJSONWithNewIds(jsonData);
            const l_cNewElement = C_Element.F_cFromJSON(clonedData);
            
            // Décaler de 20px pour chaque élément collé
            const currentLeft = parseInt(l_cNewElement.attributes.style.left) || 0;
            const currentTop = parseInt(l_cNewElement.attributes.style.top) || 0;
            l_cNewElement.attributes.style.left = (currentLeft + 20 + (index * 10)) + 'px';
            l_cNewElement.attributes.style.top = (currentTop + 20 + (index * 10)) + 'px';
            
            this.G_lElements.push(l_cNewElement);
            l_lNewElements.push(l_cNewElement);
        });
        
        this.G_lSelectedElements = l_lNewElements;
        
        this.f_vRenderAll();
        this.f_vSaveHistory();
        
        // Appliquer le style multi-sélection aux nouveaux éléments
        this.G_lSelectedElements.forEach(element => {
            const domElement = document.getElementById(element.id);
            if(domElement) {
                domElement.classList.add('multi-selected');
            }
        });
    }

    f_cCloneJSONWithNewIds(p_cData) {
        const clonedData = JSON.parse(JSON.stringify(p_cData));
        const f_vAssign = (node) => {
            node.id = 'el-' + this.G_iCounter++;
            if(node.children && node.children.length > 0) {
                node.children.forEach(child => f_vAssign(child));
            }
        };
        f_vAssign(clonedData);
        return clonedData;
    }
    
    f_vDeselectAll() {
        // Retirer la sélection unique
        if(this.G_cSelectedElement) {
            const domElement = document.getElementById(this.G_cSelectedElement.id);
            if(domElement) {
                domElement.classList.remove('selected');
            }
            this.G_cSelectedElement = null;
        }
        
        // Retirer la multi-sélection
        this.G_lSelectedElements.forEach(element => {
            const domElement = document.getElementById(element.id);
            if(domElement) {
                domElement.classList.remove('multi-selected');
            }
        });
        this.G_lSelectedElements = [];
    }
    
    f_vToggleDropdown(p_sDropdownId) {
        const dropdown = document.getElementById(p_sDropdownId);
        if(!dropdown) return;
        
        // Fermer tous les autres dropdowns
        document.querySelectorAll('.c-dropdown-content').forEach(d => {
            if(d.id !== p_sDropdownId) {
                d.classList.remove('show');
            }
        });
        
        // Toggle le dropdown actuel
        dropdown.classList.toggle('show');
    }
    
    f_vCloseDropdown(p_sDropdownId) {
        const dropdown = document.getElementById(p_sDropdownId);
        if(dropdown) {
            dropdown.classList.remove('show');
        }
    }
    
    f_vToggleComponentMode(p_bEnabled) {
        if(p_bEnabled) {
            this.f_vOpenComponentCreator();
        } else {
            this.f_vExitComponentCreator();
        }
    }
    
    f_vOpenComponentCreator() {
        // Activer le mode création de composant
        this.G_bComponentCreationMode = true;
        
        // Sauvegarder les éléments actuels avant de passer en mode composant
        this.G_lElementsBackup = this.G_lElements.map(el => el.F_cToJSON());
        
        // Vider les éléments du workspace
        this.G_lElements = [];
        this.G_cSelectedElement = null;
        this.G_lSelectedElements = [];
    this.G_cCurrentComponent = null;
        
        // Basculer vers l'onglet "Mes Composants"
        this.F_vSwitchTab('mycomponents');
        
        // Cacher l'onglet Pages, afficher l'onglet Mes Composants
        document.getElementById('G_sTabPages').style.display = 'none';
        document.getElementById('G_sTabMyComponents').style.display = 'flex';
        
        // Afficher le bouton de sauvegarde
        document.getElementById('G_sComponentSaveBtn').style.display = 'flex';
        
        // Rafraîchir l'affichage
        this.f_vRenderAll();
        this.f_vRenderTree();
        
        this.f_vShowToast('Mode création de composant activé', 'info', 2000);
    }
    
    f_vExitComponentCreator() {
        // Sauvegarder le composant actuel si nécessaire
        if(this.G_cCurrentComponent && this.G_lElements.length > 0) {
            const save = confirm('Voulez-vous sauvegarder le composant en cours ?');
            if(save) {
                this.f_vSaveCurrentComponent();
            }
        }
        
        // Désactiver le toggle
        const toggle = document.getElementById('G_sComponentModeToggle');
        if(toggle) toggle.checked = false;
        
        // Désactiver le mode création de composant
        this.G_bComponentCreationMode = false;
        this.G_cCurrentComponent = null;
        
        // Restaurer les éléments sauvegardés
        if(this.G_lElementsBackup) {
            this.G_lElements = this.G_lElementsBackup.map(el => C_Element.F_cFromJSON(el));
            this.G_lElementsBackup = null;
        } else {
            this.G_lElements = [];
        }
        
        this.G_cSelectedElement = null;
        this.G_lSelectedElements = [];
        
        // Restaurer les onglets
        document.getElementById('G_sTabPages').style.display = 'flex';
        document.getElementById('G_sTabMyComponents').style.display = 'none';
        
        // Cacher le bouton de sauvegarde
        document.getElementById('G_sComponentSaveBtn').style.display = 'none';
        
        // Retourner à l'onglet composants
        this.F_vSwitchTab('components');
        
        // Rafraîchir l'affichage
        this.f_vRenderAll();
        this.f_vRenderTree();
        this.f_vRenderProperties();
        
        this.f_vShowToast('Mode création désactivé', 'info', 2000);
    }
    
    f_vLoadCustomComponents() {
        const saved = localStorage.getItem('custom_components');
        if(saved) {
            try {
                this.G_lCustomComponents = JSON.parse(saved);
            } catch(e) {
                console.error('Erreur de chargement des composants:', e);
                this.G_lCustomComponents = [];
            }
        }
    }
    
    f_vSaveCustomComponents() {
        localStorage.setItem('custom_components', JSON.stringify(this.G_lCustomComponents));
    }
    
    f_vCreateNewComponent() {
        this.f_vPrompt(
            'Nom du nouveau composant',
            (componentName) => {
                if(!componentName || componentName.trim() === '') {
                    this.f_vShowToast('Nom invalide', 'warning', 2000);
                    return;
                }
                
                const newComponent = {
                    id: `component_${Date.now()}`,
                    name: componentName.trim(),
                    icon: '🧩',
                    description: 'Nouveau composant personnalisé',
                    elements: [],
                    parameters: {},
                    css: {},
                    html: '',
                    category: 'custom'
                };
                
                this.G_lCustomComponents.push(newComponent);
                this.G_iComponentCounter++;
                this.f_vSaveCustomComponents();
                this.f_vRenderMyComponentsList();
                this.f_vLoadComponentForEditing(newComponent);
                
                // Rafraîchir la bibliothèque de composants en mode édition normale
                if(!this.G_bComponentCreationMode) {
                    this.f_vRenderComponentLibrary();
                }
            },
            `Composant ${this.G_iComponentCounter + 1}`,
            'Nouveau Composant',
            'Ex: Bouton Primaire, Card Article...'
        );
    }
    
    f_vLoadComponentForEditing(component) {
        this.G_cCurrentComponent = component;
        
        // Charger les éléments du composant (convertir depuis JSON)
        this.G_lElements = (component.elements || []).map(el => C_Element.F_cFromJSON(el));
        
        // Réinitialiser la sélection
        this.G_cSelectedElement = null;
        this.G_lSelectedElements = [];
        
        // Rafraîchir l'affichage
        this.f_vRenderAll();
        this.f_vRenderTree();
        this.f_vRenderProperties();
        
        this.f_vShowToast(`Édition: ${component.name}`, 'info', 2000);
    }
    
    f_vSaveCurrentComponent() {
        if(!this.G_cCurrentComponent) {
            this.f_vShowToast('Aucun composant sélectionné', 'warning', 2000);
            return;
        }
        
        // Mettre à jour les éléments du composant (convertir vers JSON)
        this.G_cCurrentComponent.elements = this.G_lElements.map(el => el.F_cToJSON());
        
        // Mettre à jour dans la liste
        const index = this.G_lCustomComponents.findIndex(c => c.id === this.G_cCurrentComponent.id);
        if(index !== -1) {
            this.G_lCustomComponents[index] = this.G_cCurrentComponent;
        }
        
        // Sauvegarder dans localStorage
        this.f_vSaveCustomComponents();
        
        // Rafraîchir la bibliothèque de composants en mode édition normale
        if(!this.G_bComponentCreationMode) {
            this.f_vRenderComponentLibrary();
        }
        
        this.f_vShowToast('✅ Composant sauvegardé', 'success', 2000);
    }
    
    f_vDeleteComponent(componentId) {
        if(!confirm('Supprimer ce composant ?')) return;
        
        this.G_lCustomComponents = this.G_lCustomComponents.filter(c => c.id !== componentId);
        this.f_vSaveCustomComponents();
        this.f_vRenderMyComponentsList();
        
        // Rafraîchir la bibliothèque de composants en mode édition normale
        if(!this.G_bComponentCreationMode) {
            this.f_vRenderComponentLibrary();
        }
        
        if(this.G_cCurrentComponent && this.G_cCurrentComponent.id === componentId) {
            this.G_cCurrentComponent = null;
            this.G_lElements = [];
            this.f_vRenderAll();
        }
        
        this.f_vShowToast('🗑️ Composant supprimé', 'info', 2000);
    }
    
    f_vDuplicateComponent(componentId) {
        const component = this.G_lCustomComponents.find(c => c.id === componentId);
        if(!component) return;
        
        const duplicate = JSON.parse(JSON.stringify(component));
        duplicate.id = `component_${Date.now()}`;
        duplicate.name = `${component.name} (copie)`;
        
        this.G_lCustomComponents.push(duplicate);
        this.f_vSaveCustomComponents();
        this.f_vRenderMyComponentsList();
        
        this.f_vShowToast('📋 Composant dupliqué', 'success', 2000);
    }
    
    f_vInstantiateCustomComponent(component, x, y) {
        // Créer des instances de tous les éléments du composant
        const instantiateElements = (elements, parentId = null) => {
            return elements.map(elData => {
                const newId = 'el-' + this.G_iCounter++;
                const newElement = C_Element.F_cFromJSON(elData);
                newElement.id = newId;
                
                // Positionner le premier élément à la position du drop
                if(!parentId && elements[0] === elData) {
                    if(!newElement.attributes.style.position || newElement.attributes.style.position === 'static') {
                        newElement.attributes.style.position = 'absolute';
                    }
                    newElement.attributes.style.left = x + 'px';
                    newElement.attributes.style.top = y + 'px';
                }
                
                // Recréer les enfants récursivement
                if(elData.children && elData.children.length > 0) {
                    newElement.children = instantiateElements(elData.children, newId);
                    newElement.children.forEach(child => child.parent = newElement);
                }
                
                return newElement;
            });
        };
        
        const newElements = instantiateElements(component.elements);
        this.G_lElements.push(...newElements);
        
        this.f_vShowToast(`✨ Composant "${component.name}" ajouté`, 'success', 2000);
    }
    
    f_vExportComponent(componentId) {
        const component = this.G_lCustomComponents.find(c => c.id === componentId);
        if(!component) return;
        
        const json = JSON.stringify(component, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${component.name}.json`;
        link.click();
        
        this.f_vShowToast('📦 Composant exporté', 'success', 2000);
    }
    
    f_vImportComponent() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if(!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const component = JSON.parse(event.target.result);
                    
                    // Valider que c'est bien un composant
                    if(!component.id || !component.name || !component.elements) {
                        this.f_vAlertError('Le fichier JSON n\'est pas un composant valide', 'Import impossible');
                        return;
                    }
                    
                    // Générer un nouvel ID pour éviter les conflits
                    component.id = `component_${Date.now()}`;
                    
                    // Ajouter à la liste
                    this.G_lCustomComponents.push(component);
                    this.G_iComponentCounter++;
                    this.f_vSaveCustomComponents();
                    this.f_vRenderMyComponentsList();
                    
                    // Rafraîchir la bibliothèque de composants en mode édition normale
                    if(!this.G_bComponentCreationMode) {
                        this.f_vRenderComponentLibrary();
                    }
                    
                    this.f_vShowToast(`✅ Composant "${component.name}" importé avec succès`, 'success', 3000);
                } catch(error) {
                    console.error('Erreur d\'import:', error);
                    this.f_vAlertError('Erreur lors de la lecture du fichier JSON', 'Import échoué');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    f_vSelectComponent(componentId) {
        // Juste sélectionner visuellement, ne pas charger
        this.G_lCustomComponents.forEach(comp => {
            const item = document.querySelector(`[onclick*="${comp.id}"]`);
            if(item && item.classList.contains('c-my-component-item')) {
                if(comp.id === componentId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        });
    }
    
    f_vRenderMyComponentsList() {
        const view = document.getElementById('G_sMyComponentsView');
        if(!view) return;
        
        view.innerHTML = `
            <div style="padding: 15px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button class="c-btn c-btn-success" onclick="G_cApp.f_vCreateNewComponent()" style="flex: 1;">
                        <i class="fas fa-plus"></i> Nouveau
                    </button>
                    <button class="c-btn c-btn-primary" onclick="G_cApp.f_vImportComponent()" style="flex: 1;">
                        <i class="fas fa-file-import"></i> Importer
                    </button>
                </div>
                
                <h3 style="color: #999; margin-bottom: 15px; font-size: 14px;">
                    <i class="fas fa-folder"></i> Mes Composants (${this.G_lCustomComponents.length})
                </h3>
                
                ${this.G_lCustomComponents.length === 0 ? 
                    '<p style="color: #666; font-size: 13px; text-align: center; padding: 20px;">Aucun composant créé</p>' :
                    this.G_lCustomComponents.map(comp => `
                        <div class="c-my-component-item ${this.G_cCurrentComponent && this.G_cCurrentComponent.id === comp.id ? 'active' : ''}" 
                             onclick="G_cApp.f_vSelectComponent('${comp.id}')"
                             ondblclick="G_cApp.f_vLoadComponentForEditing(${JSON.stringify(comp).replace(/"/g, '&quot;')})">
                            <div class="c-component-info">
                                <div style="font-size: 16px; margin-bottom: 5px;">${comp.icon} ${comp.name}</div>
                                <div style="font-size: 11px; color: #999;">${comp.elements.length} élément(s)</div>
                            </div>
                            <div class="c-component-actions">
                                <button onclick="event.stopPropagation(); G_cApp.f_vSaveCurrentComponent()" title="Sauvegarder" class="c-action-btn">
                                    <i class="fas fa-save"></i>
                                </button>
                                <button onclick="event.stopPropagation(); G_cApp.f_vExportComponent('${comp.id}')" title="Exporter" class="c-action-btn">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button onclick="event.stopPropagation(); G_cApp.f_vDuplicateComponent('${comp.id}')" title="Dupliquer" class="c-action-btn">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button onclick="event.stopPropagation(); G_cApp.f_vDeleteComponent('${comp.id}')" title="Supprimer" class="c-action-btn c-action-btn-danger">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        `;
    }
    
    f_vToggleLayoutMode() {
        // Mode désactivé : toujours afficher le rendu final
        // Les éléments absolute peuvent être déplacés
        // Les éléments non-absolute peuvent être redimensionnés uniquement
        this.f_vShowToast('Mode désactivé : rendu final toujours actif', 'info', 2000);
    }

    async f_vLoadComponentTemplates() {
        const componentFiles = [
            'button', 'card', 'navbar', 'modal', 'datatable', 
            'form', 'gallery', 'userprofile', 'todolist', 'pricingcard'
        ];
        
        // Cache-buster pour forcer le rechargement
        const cacheBuster = new Date().getTime();
        
        for(let file of componentFiles) {
            try {
                const response = await fetch(`./ui/${file}.json?v=${cacheBuster}`);
                if(response.ok) {
                    const template = await response.json();
                    console.log(`✅ Composant chargé: ${file}`, template);
                    this.G_lComponentTemplates.push(template);
                } else {
                    console.warn(`❌ Erreur HTTP pour ${file}: ${response.status}`);
                }
            } catch(e) {
                console.error(`❌ Erreur de chargement pour ${file}:`, e);
            }
        }
        console.log(`📦 Total composants chargés: ${this.G_lComponentTemplates.length}`);
    }

    f_vRenderComponentLibrary() {
        const library = document.getElementById('G_sComponentLibrary');
        
        let html = '<h3 style="margin-bottom: 15px;"><i class="fas fa-code"></i> Composants HTML</h3>';
        const htmlComponents = [
            {type: 'div', icon: '<i class="fas fa-square"></i>', name: 'DIV Container'},
            {type: 'input', icon: '<i class="fas fa-edit"></i>', name: 'Input'},
            {type: 'textarea', icon: '<i class="fas fa-align-left"></i>', name: 'Textarea'},
            {type: 'select', icon: '<i class="fas fa-list"></i>', name: 'Select'},
            {type: 'p', icon: '<i class="fas fa-paragraph"></i>', name: 'Paragraph'},
            {type: 'h1', icon: '<i class="fas fa-heading"></i>', name: 'Heading 1'},
            {type: 'h2', icon: '<i class="fas fa-heading"></i>', name: 'Heading 2'},
            {type: 'h3', icon: '<i class="fas fa-heading"></i>', name: 'Heading 3'},
            {type: 'img', icon: '<i class="fas fa-image"></i>', name: 'Image'},
            {type: 'form', icon: '<i class="fas fa-wpforms"></i>', name: 'Form'},
            {type: 'ul', icon: '<i class="fas fa-list-ul"></i>', name: 'Liste UL'},
            {type: 'table', icon: '<i class="fas fa-table"></i>', name: 'Table'},
            {type: 'a', icon: '<i class="fas fa-link"></i>', name: 'Link'}
        ];

        htmlComponents.forEach(comp => {
            html += `<div class="c-component-item" draggable="true" data-type="${comp.type}">${comp.icon} ${comp.name}</div>`;
        });

        html += '<h3 style="margin: 15px 0;"><i class="fas fa-layer-group"></i> Composants UI</h3>';
        
        // Templates chargés depuis JSON
        this.G_lComponentTemplates.forEach((template, idx) => {
            html += `<div class="c-component-item" draggable="true" data-template="${idx}">${template.icon} ${template.name}</div>`;
        });

        // Composants UI par défaut
        const uiComponents = [
            {type: 'alert', icon: '<i class="fas fa-exclamation-triangle"></i>', name: 'Alert'},
            {type: 'grid', icon: '<i class="fas fa-th"></i>', name: 'Grid'},
            {type: 'sidebar', icon: '<i class="fas fa-bars"></i>', name: 'Sidebar'},
            {type: 'footer', icon: '<i class="fas fa-shoe-prints"></i>', name: 'Footer'}
        ];

        uiComponents.forEach(comp => {
            html += `<div class="c-component-item" draggable="true" data-type="${comp.type}">${comp.icon} ${comp.name}</div>`;
        });
        
        // Section Mes Composants personnalisés
        if(this.G_lCustomComponents.length > 0) {
            html += '<h3 style="margin: 15px 0;"><i class="fas fa-puzzle-piece"></i> Mes Composants</h3>';
            this.G_lCustomComponents.forEach((comp, idx) => {
                html += `<div class="c-component-item" draggable="true" data-custom-component="${idx}">${comp.icon} ${comp.name}</div>`;
            });
        }

        library.innerHTML = html;
    }

    F_vSwitchTab(p_sTab) {
        this.G_sActiveTab = p_sTab;
        
        document.querySelectorAll('.c-tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        document.getElementById('G_sComponentLibrary').classList.toggle('active', p_sTab === 'components');
        document.getElementById('G_sTreeView').classList.toggle('active', p_sTab === 'tree');
        document.getElementById('G_sPagesView').classList.toggle('active', p_sTab === 'pages');
        document.getElementById('G_sMyComponentsView').classList.toggle('active', p_sTab === 'mycomponents');
        
        // Rafraîchir la liste selon l'onglet
        if (p_sTab === 'pages') {
            this.f_vRenderPagesList();
        } else if (p_sTab === 'mycomponents') {
            this.f_vRenderMyComponentsList();
        }
    }

    f_vSetupFileInput() {
        const l_cInput = document.getElementById('G_sFileInput');
        l_cInput.addEventListener('change', (l_cE) => {
            const l_cFile = l_cE.target.files[0];
            if(l_cFile) {
                const l_cReader = new FileReader();
                l_cReader.onload = (e) => {
                    try {
                        const l_cData = JSON.parse(e.target.result);
                        this.F_vLoadProject(l_cData);
                    } catch(err) {
                        this.f_vAlertError('Le fichier JSON est invalide ou corrompu.', 'Erreur de chargement');
                    }
                };
                l_cReader.readAsText(l_cFile);
            }
        });
    }

    f_vSetupPanelResizer() {
        const resizer = document.getElementById('G_sRightPanelResizer');
        const rightPanel = document.getElementById('G_sRightPanel');
        
        if(!resizer || !rightPanel) return;
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = rightPanel.offsetWidth;
            
            // Empêcher la sélection de texte pendant le redimensionnement
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'ew-resize';
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if(!isResizing) return;
            
            const deltaX = startX - e.clientX;
            const newWidth = startWidth + deltaX;
            
            // Limiter la taille entre 200px et 600px
            if(newWidth >= 200 && newWidth <= 600) {
                rightPanel.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if(isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        });
    }

    f_vSetupDragDrop() {
        document.addEventListener('dragstart', (l_cE) => {
            if(l_cE.target.classList.contains('c-component-item')) {
                const templateIdx = l_cE.target.dataset.template;
                const customCompIdx = l_cE.target.dataset.customComponent;
                
                if(customCompIdx !== undefined) {
                    // Composant personnalisé
                    this.G_cDraggedCustomComponent = this.G_lCustomComponents[parseInt(customCompIdx)];
                    this.G_cDraggedTemplate = null;
                    this.G_cDraggedComponent = null;
                } else if(templateIdx !== undefined) {
                    // Template UI
                    this.G_cDraggedTemplate = this.G_lComponentTemplates[parseInt(templateIdx)];
                    this.G_cDraggedComponent = null;
                    this.G_cDraggedCustomComponent = null;
                } else {
                    // Composant HTML simple
                    this.G_cDraggedComponent = l_cE.target.dataset.type;
                    this.G_cDraggedTemplate = null;
                    this.G_cDraggedCustomComponent = null;
                }
            }
        });
    }

    f_vSetupCanvas() {
        const l_cWorkspace = document.getElementById('G_sWorkspace');
        
        l_cWorkspace.addEventListener('dragover', (l_cE) => {
            // Accepter le drop sur le workspace ou ses enfants directs (éléments de niveau racine)
            if(this.G_cDraggedComponent || this.G_cDraggedTemplate || this.G_cDraggedCustomComponent) {
                l_cE.preventDefault();
            }
        });

        l_cWorkspace.addEventListener('drop', (l_cE) => {
            // Drop sur le workspace principal (pas dans un conteneur)
            if(this.G_cDraggedComponent || this.G_cDraggedTemplate || this.G_cDraggedCustomComponent) {
                // Vérifier si on a droppé sur le workspace lui-même ou sur un élément de niveau racine
                const isWorkspace = l_cE.target.id === 'G_sWorkspace';
                const isRootElement = l_cE.target.classList.contains('c-element') && 
                                    this.G_lElements.some(el => el.id === l_cE.target.id);
                
                if(isWorkspace || isRootElement) {
                    l_cE.preventDefault();
                    l_cE.stopPropagation();
                    
                    const { x: l_fDropX, y: l_fDropY } = this.f_cGetWorkspaceCoords(l_cE.clientX, l_cE.clientY);
                    const l_iDropLeft = Math.round(l_fDropX);
                    const l_iDropTop = Math.round(l_fDropY);
                    
                    if(this.G_cDraggedCustomComponent) {
                        // Instancier le composant personnalisé
                        this.f_vInstantiateCustomComponent(this.G_cDraggedCustomComponent, l_iDropLeft, l_iDropTop);
                    } else {
                        // Composant normal ou template
                        const l_sId = 'el-' + this.G_iCounter++;
                        
                        let l_cElement;
                        if(this.G_cDraggedTemplate) {
                            // Remplacer espaces par tirets pour un type valide
                            const l_sType = this.G_cDraggedTemplate.name.toLowerCase().replace(/\s+/g, '-');
                            l_cElement = new C_Element(l_sType, l_sId, this.G_cDraggedTemplate);
                        } else {
                            l_cElement = new C_Element(this.G_cDraggedComponent, l_sId);
                        }
                        
                        l_cElement.attributes.style.left = l_iDropLeft + 'px';
                        l_cElement.attributes.style.top = l_iDropTop + 'px';
                        l_cElement.attributes.style.position = 'absolute';
                        
                        this.G_lElements.push(l_cElement);
                    }
                    
                    // Sauvegarder dans la page courante
                    if (this.G_cCurrentPage) {
                        this.G_cCurrentPage.elements = this.G_lElements.map(e =>
                            typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
                        );
                    }
                    
                    this.f_vRenderAll();
                    this.G_cDraggedComponent = null;
                    this.G_cDraggedTemplate = null;
                    this.G_cDraggedCustomComponent = null;

                    // Rafraîchir le graph si ouvert
                    if (window.G_cGraphVisualizer && document.getElementById('G_sGraphPopup').style.display === 'flex') {
                        window.G_cGraphVisualizer.F_vRefresh();
                    }
                }
            }
        });

        l_cWorkspace.addEventListener('click', (l_cE) => {
            if(l_cE.target === l_cWorkspace) {
                // Sélectionner le body au lieu de désélectionner
                this.G_cSelectedElement = this.G_cBodyElement;
                this.G_lSelectedElements = [];
                this.f_vRenderAll();
                this.f_vRenderProperties();
            }
        });
        
        // Zoom et Pan sur tout le panel central
        const centerPanel = document.getElementById('G_sCanvas');
        let panStartX, panStartY;
        
        // Zoom avec Ctrl + molette - depuis la position du curseur
        centerPanel.addEventListener('wheel', (e) => {
            if(e.ctrlKey) {
                e.preventDefault();
                
                // Vérifier si le curseur est bien sur le panel central
                const panelRect = centerPanel.getBoundingClientRect();
                const workspace = document.getElementById('G_sWorkspace');
                if (!workspace) {
                    return;
                }
                const workspaceRect = workspace.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                // Si le curseur n'est pas sur le panel, bloquer le zoom
                if(mouseX < panelRect.left || mouseX > panelRect.right || 
                   mouseY < panelRect.top || mouseY > panelRect.bottom) {
                    return;
                }
                
                const oldZoom = this.G_fZoom;
                const oldPanX = this.G_cPanOffset.x;
                const oldPanY = this.G_cPanOffset.y;
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.G_fZoom *= delta;
                this.G_fZoom = Math.max(0.1, Math.min(5, this.G_fZoom)); // Limiter entre 0.1x et 5x
                
                // Position du curseur relative au workspace (prendre en compte le pan et le centrage)
                const cursorX = mouseX - workspaceRect.left + oldPanX;
                const cursorY = mouseY - workspaceRect.top + oldPanY;
                
                // Ajuster le pan pour que le zoom se fasse depuis la position du curseur
                const zoomRatio = this.G_fZoom / oldZoom;
                this.G_cPanOffset.x = cursorX - (cursorX - oldPanX) * zoomRatio;
                this.G_cPanOffset.y = cursorY - (cursorY - oldPanY) * zoomRatio;
                
                this.f_vApplyZoomAndPan();
            }
        }, { passive: false });
        
        // Pan avec Ctrl + Shift + clic gauche
        centerPanel.addEventListener('mousedown', (e) => {
            if(e.ctrlKey && e.shiftKey && e.button === 0) {
                e.preventDefault();
                this.G_bIsPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                centerPanel.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if(this.G_bIsPanning) {
                const dx = e.clientX - panStartX;
                const dy = e.clientY - panStartY;
                this.G_cPanOffset.x += dx;
                this.G_cPanOffset.y += dy;
                panStartX = e.clientX;
                panStartY = e.clientY;
                this.f_vApplyZoomAndPan();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if(this.G_bIsPanning) {
                this.G_bIsPanning = false;
                centerPanel.style.cursor = '';
            }
        });
    }
    
    f_vApplyZoomAndPan() {
        const workspace = document.getElementById('G_sWorkspace');
        workspace.style.transform = `scale(${this.G_fZoom}) translate(${this.G_cPanOffset.x / this.G_fZoom}px, ${this.G_cPanOffset.y / this.G_fZoom}px)`;
        workspace.style.transformOrigin = '0 0'; // Origin en haut gauche, le centrage est géré par le pan
        
        // Mettre à jour la taille de la grille en fonction du zoom
        if (typeof this.f_vUpdateGridSize === 'function') {
            this.f_vUpdateGridSize();
        }
    }

    f_vApplyInitialZoom() {
        const workspace = document.getElementById('G_sWorkspace');
        if (!workspace) {
            return;
        }

        const width = workspace.offsetWidth || parseFloat(getComputedStyle(workspace).width) || 0;
        const height = workspace.offsetHeight || parseFloat(getComputedStyle(workspace).height) || 0;

        if (width && height) {
            this.G_cPanOffset.x = (1 - this.G_fZoom) * width / 2;
            this.G_cPanOffset.y = (1 - this.G_fZoom) * height / 2;
        }

        this.f_vApplyZoomAndPan();
    }
    
    // Convertir les coordonnées de la souris (écran) en coordonnées du workspace (avec zoom/pan)
    f_cGetWorkspaceCoords(p_iClientX, p_iClientY) {
        const workspace = document.getElementById('G_sWorkspace');
        const rect = workspace.getBoundingClientRect();
        
        // Coordonnées relatives au workspace
        const x = (p_iClientX - rect.left) / this.G_fZoom;
        const y = (p_iClientY - rect.top) / this.G_fZoom;
        
        return { x, y };
    }
    
    // Système de snap aux éléments
    f_cSnapToElements(p_cDraggedElement, p_iLeft, p_iTop) {
        const SNAP_THRESHOLD = 10; // Distance de snap en pixels
        const guides = [];
        let snappedLeft = p_iLeft;
        let snappedTop = p_iTop;
        
        // Dimensions de l'élément déplacé
        const draggedWidth = parseInt(p_cDraggedElement.attributes.style.width) || 0;
        const draggedHeight = parseInt(p_cDraggedElement.attributes.style.height) || 0;
        const draggedRight = p_iLeft + draggedWidth;
        const draggedBottom = p_iTop + draggedHeight;
        const draggedCenterX = p_iLeft + draggedWidth / 2;
        const draggedCenterY = p_iTop + draggedHeight / 2;
        
        // Parcourir tous les autres éléments
        const allElements = this.f_lGetAllElements();
        allElements.forEach(el => {
            if (el.id === p_cDraggedElement.id) return; // Ignorer l'élément lui-même
            
            const elLeft = parseInt(el.attributes.style.left) || 0;
            const elTop = parseInt(el.attributes.style.top) || 0;
            const elWidth = parseInt(el.attributes.style.width) || 0;
            const elHeight = parseInt(el.attributes.style.height) || 0;
            const elRight = elLeft + elWidth;
            const elBottom = elTop + elHeight;
            const elCenterX = elLeft + elWidth / 2;
            const elCenterY = elTop + elHeight / 2;
            
            // Snap horizontal (gauche, centre, droite)
            // Gauche à gauche
            if (Math.abs(p_iLeft - elLeft) < SNAP_THRESHOLD) {
                snappedLeft = elLeft;
                guides.push({ type: 'vertical', pos: elLeft });
            }
            // Droite à droite
            if (Math.abs(draggedRight - elRight) < SNAP_THRESHOLD) {
                snappedLeft = elRight - draggedWidth;
                guides.push({ type: 'vertical', pos: elRight });
            }
            // Gauche à droite
            if (Math.abs(p_iLeft - elRight) < SNAP_THRESHOLD) {
                snappedLeft = elRight;
                guides.push({ type: 'vertical', pos: elRight });
            }
            // Droite à gauche
            if (Math.abs(draggedRight - elLeft) < SNAP_THRESHOLD) {
                snappedLeft = elLeft - draggedWidth;
                guides.push({ type: 'vertical', pos: elLeft });
            }
            // Centre à centre (horizontal)
            if (Math.abs(draggedCenterX - elCenterX) < SNAP_THRESHOLD) {
                snappedLeft = elCenterX - draggedWidth / 2;
                guides.push({ type: 'vertical', pos: elCenterX });
            }
            
            // Snap vertical (haut, centre, bas)
            // Haut à haut
            if (Math.abs(p_iTop - elTop) < SNAP_THRESHOLD) {
                snappedTop = elTop;
                guides.push({ type: 'horizontal', pos: elTop });
            }
            // Bas à bas
            if (Math.abs(draggedBottom - elBottom) < SNAP_THRESHOLD) {
                snappedTop = elBottom - draggedHeight;
                guides.push({ type: 'horizontal', pos: elBottom });
            }
            // Haut à bas
            if (Math.abs(p_iTop - elBottom) < SNAP_THRESHOLD) {
                snappedTop = elBottom;
                guides.push({ type: 'horizontal', pos: elBottom });
            }
            // Bas à haut
            if (Math.abs(draggedBottom - elTop) < SNAP_THRESHOLD) {
                snappedTop = elTop - draggedHeight;
                guides.push({ type: 'horizontal', pos: elTop });
            }
            // Centre à centre (vertical)
            if (Math.abs(draggedCenterY - elCenterY) < SNAP_THRESHOLD) {
                snappedTop = elCenterY - draggedHeight / 2;
                guides.push({ type: 'horizontal', pos: elCenterY });
            }
        });
        
        return { left: snappedLeft, top: snappedTop, guides };
    }
    
    // Récupérer tous les éléments (y compris les enfants)
    f_lGetAllElements() {
        const allElements = [];
        const recurse = (elements) => {
            elements.forEach(el => {
                allElements.push(el);
                if (el.children && el.children.length > 0) {
                    recurse(el.children);
                }
            });
        };
        recurse(this.G_lElements);
        return allElements;
    }
    
    // Afficher les guides de snap
    f_vShowSnapGuides(p_lGuides) {
        this.f_vHideSnapGuides(); // Supprimer les anciens guides
        
        const workspace = document.getElementById('G_sWorkspace');
        
        p_lGuides.forEach(guide => {
            const guideEl = document.createElement('div');
            guideEl.className = `c-snap-guide c-snap-guide-${guide.type}`;
            
            if (guide.type === 'vertical') {
                guideEl.style.left = guide.pos + 'px';
            } else {
                guideEl.style.top = guide.pos + 'px';
            }
            
            workspace.appendChild(guideEl);
        });
    }
    
    // Masquer les guides de snap
    f_vHideSnapGuides() {
        const workspace = document.getElementById('G_sWorkspace');
        const guides = workspace.querySelectorAll('.c-snap-guide');
        guides.forEach(guide => guide.remove());
    }
    
    // Sauvegarder l'état actuel dans l'historique
    f_vSaveHistory() {
        if(this.G_bIsRestoringHistory) return; // Ne pas sauvegarder pendant une restauration
        
        // Sérialiser les éléments avec leur méthode F_cToJSON pour éviter les références circulaires
        const elementsJSON = this.G_lElements.map(el => el.F_cToJSON());
        
        const state = {
            elements: JSON.parse(JSON.stringify(elementsJSON)),
            bodyStyle: JSON.parse(JSON.stringify(this.G_cBodyElement.attributes.style)),
            bodyClassName: this.G_cBodyElement.attributes.className,
            bodyPseudoStyles: JSON.parse(JSON.stringify(this.G_cBodyElement.pseudoStyles))
        };
        
        // Supprimer l'historique "futur" si on est au milieu
        if(this.G_iHistoryIndex < this.G_lHistory.length - 1) {
            this.G_lHistory = this.G_lHistory.slice(0, this.G_iHistoryIndex + 1);
        }
        
        this.G_lHistory.push(state);
        this.G_iHistoryIndex++;
        
        // Limiter l'historique à 50 actions
        if(this.G_lHistory.length > 50) {
            this.G_lHistory.shift();
            this.G_iHistoryIndex--;
        }
    }
    
    // Undo - Ctrl+Z
    f_vUndo() {
        if(this.G_iHistoryIndex <= 0) {
            this.f_vShowToast('Aucune action à annuler', 'warning', 2000);
            return;
        }
        
        console.log(`Undo: ${this.G_iHistoryIndex} -> ${this.G_iHistoryIndex - 1}`);
        
        this.G_bIsRestoringHistory = true;
        this.G_iHistoryIndex--;
        const state = this.G_lHistory[this.G_iHistoryIndex];
        
        // Restaurer les éléments en utilisant F_cFromJSON
        this.G_lElements = state.elements.map(elJSON => C_Element.F_cFromJSON(elJSON));
        this.G_cBodyElement.attributes.style = JSON.parse(JSON.stringify(state.bodyStyle));
        this.G_cBodyElement.attributes.className = state.bodyClassName;
        this.G_cBodyElement.pseudoStyles = JSON.parse(JSON.stringify(state.bodyPseudoStyles));
        
        this.f_vRenderAll();
        this.f_vRenderTree();
        this.f_vRenderProperties();
        
        this.G_bIsRestoringHistory = false;
        this.f_vShowToast('Action annulée', 'info', 1500);
    }
    
    // Redo - Ctrl+Shift+Z
    f_vRedo() {
        if(this.G_iHistoryIndex >= this.G_lHistory.length - 1) {
            this.f_vShowToast('Aucune action à refaire', 'warning', 2000);
            return;
        }
        
        console.log(`Redo: ${this.G_iHistoryIndex} -> ${this.G_iHistoryIndex + 1}`);
        
        this.G_bIsRestoringHistory = true;
        this.G_iHistoryIndex++;
        const state = this.G_lHistory[this.G_iHistoryIndex];
        
        // Restaurer les éléments en utilisant F_cFromJSON
        this.G_lElements = state.elements.map(elJSON => C_Element.F_cFromJSON(elJSON));
        this.G_cBodyElement.attributes.style = JSON.parse(JSON.stringify(state.bodyStyle));
        this.G_cBodyElement.attributes.className = state.bodyClassName;
        this.G_cBodyElement.pseudoStyles = JSON.parse(JSON.stringify(state.bodyPseudoStyles));
        
        this.f_vRenderAll();
        this.f_vRenderTree();
        this.f_vRenderProperties();
        
        this.G_bIsRestoringHistory = false;
        this.f_vShowToast('Action rétablie', 'info', 1500);
    }

    f_vSetupElementDrag(p_cElement, p_cDOMElement) {
        let l_iStartX, l_iStartY, l_iInitialLeft, l_iInitialTop;
        let l_lMultiElementsInitialPositions = []; // Pour stocker les positions initiales de tous les éléments sélectionnés
        let l_bHasMoved = false;

        p_cDOMElement.addEventListener('mousedown', (l_cE) => {
            if(l_cE.target.classList.contains('c-resize-handle')) return;
            
            // Bloquer le drag si Ctrl+Shift (mode pan)
            if(l_cE.ctrlKey && l_cE.shiftKey) return;
            
            // Si Shift est enfoncé et qu'un ancêtre sélectionné contient cet élément,
            // laisser l'ancêtre gérer l'événement pour permettre son déplacement.
            if(l_cE.shiftKey && this.f_bHasSelectedAncestor(p_cElement)) {
                return;
            }
            
            // Ne réagir QUE si on clique sur cet élément ou son contenu direct
            // Pas sur un élément enfant qui a la classe .c-element
            const clickedOnChildElement = l_cE.target !== p_cDOMElement && 
                                         l_cE.target.closest('.c-element') !== p_cDOMElement;
            
            if(clickedOnChildElement) {
                const l_bShiftOverride = l_cE.shiftKey && this.f_bIsElementSelected(p_cElement);
                if(!l_bShiftOverride) {
                    // Le clic est sur un élément enfant, ne pas sélectionner le parent
                    // L'enfant va gérer sa propre sélection
                    return;
                }
            }
            
            // Empêcher la propagation pour que le parent ne soit pas notifié
            l_cE.stopPropagation();
            
            this.F_vSelectElement(p_cElement, l_cE.ctrlKey || l_cE.metaKey);
            
            // Ne permettre le drag QUE si l'élément a position: absolute ou fixed
            // (sinon le drag sort l'élément de son flux flex/grid ce qui est indésirable)
            const l_sPosition = (p_cElement.attributes.style.position || '').toLowerCase();
            if(l_sPosition !== 'absolute' && l_sPosition !== 'fixed') {
                return; // Pas de drag pour les éléments en flux normal
            }
            
            this.G_bIsDragging = true;
            p_cDOMElement.classList.add('c-dragging');
            
            // Ajouter le style dragging à tous les éléments multi-sélectionnés
            if(this.G_lSelectedElements.length > 0) {
                this.G_lSelectedElements.forEach(el => {
                    const domEl = document.getElementById(el.id);
                    if(domEl) domEl.classList.add('c-dragging');
                });
            }
            
            // Convertir les coordonnées de départ dans l'espace du workspace
            const startCoords = this.f_cGetWorkspaceCoords(l_cE.clientX, l_cE.clientY);
            l_iStartX = startCoords.x;
            l_iStartY = startCoords.y;
            l_iInitialLeft = parseInt(p_cElement.attributes.style.left) || 0;
            l_iInitialTop = parseInt(p_cElement.attributes.style.top) || 0;
            l_bHasMoved = false;
            
            // Si multi-sélection, sauvegarder les positions initiales de tous les éléments
            if(this.G_lSelectedElements.length > 0) {
                l_lMultiElementsInitialPositions = this.G_lSelectedElements.map(el => ({
                    element: el,
                    left: parseInt(el.attributes.style.left) || 0,
                    top: parseInt(el.attributes.style.top) || 0
                }));
            }

            const f_vMouseMove = (l_cE) => {
                if(!this.G_bIsDragging) return;
                
                // Convertir les coordonnées actuelles dans l'espace du workspace
                const currentCoords = this.f_cGetWorkspaceCoords(l_cE.clientX, l_cE.clientY);
                const l_iDeltaX = currentCoords.x - l_iStartX;
                const l_iDeltaY = currentCoords.y - l_iStartY;

                if(l_iDeltaX !== 0 || l_iDeltaY !== 0) {
                    l_bHasMoved = true;
                }
                
                // Vérifier si Shift est pressé (désactive le snap)
                const snapDisabled = l_cE.shiftKey;
                let l_bShouldShowGuides = false;
                let l_lGuidesToShow = [];
                
                // Déplacer tous les éléments multi-sélectionnés
                if(this.G_lSelectedElements.length > 0) {
                    l_lMultiElementsInitialPositions.forEach(({element, left, top}) => {
                        let newLeft = left + l_iDeltaX;
                        let newTop = top + l_iDeltaY;
                        
                        // Snap to grid si activé
                        if (this.G_bGridEnabled && !snapDisabled) {
                            newLeft = this.f_cSnapToGrid(newLeft);
                            newTop = this.f_cSnapToGrid(newTop);
                        }
                        
                        element.attributes.style.left = newLeft + 'px';
                        element.attributes.style.top = newTop + 'px';
                    });
                    this.f_vHideSnapGuides();
                } else {
                    // Déplacement normal d'un seul élément
                    let newLeft = l_iInitialLeft + l_iDeltaX;
                    let newTop = l_iInitialTop + l_iDeltaY;
                    
                    // Snap to elements (ancrage sur d'autres éléments)
                    if (!snapDisabled) {
                        const snapResult = this.f_cSnapToElements(p_cElement, newLeft, newTop);
                        newLeft = snapResult.left;
                        newTop = snapResult.top;
                        if (snapResult.guides && snapResult.guides.length > 0) {
                            l_bShouldShowGuides = true;
                            l_lGuidesToShow = snapResult.guides;
                        }
                    } else {
                        this.f_vHideSnapGuides();
                    }
                    
                    // Snap to grid si activé (après le snap aux éléments)
                    if (this.G_bGridEnabled && !snapDisabled) {
                        newLeft = this.f_cSnapToGrid(newLeft);
                        newTop = this.f_cSnapToGrid(newTop);
                    }
                    
                    p_cElement.attributes.style.left = newLeft + 'px';
                    p_cElement.attributes.style.top = newTop + 'px';
                }
                
                this.f_vRenderAll();
                if (l_bShouldShowGuides) {
                    this.f_vShowSnapGuides(l_lGuidesToShow);
                } else {
                    this.f_vHideSnapGuides();
                }
                this.f_vUpdateCSSEditor(); // Mise à jour en temps réel
            };

            const f_vMouseUp = () => {
                this.G_bIsDragging = false;
                p_cDOMElement.classList.remove('c-dragging');
                
                // Masquer les guides de snap
                this.f_vHideSnapGuides();
                
                // Retirer le style dragging de tous les éléments multi-sélectionnés
                if(this.G_lSelectedElements.length > 0) {
                    this.G_lSelectedElements.forEach(el => {
                        const domEl = document.getElementById(el.id);
                        if(domEl) domEl.classList.remove('c-dragging');
                    });
                }
                
                if(l_bHasMoved) {
                    this.f_vSaveHistory(); // Sauvegarder après le déplacement
                }
                document.removeEventListener('mousemove', f_vMouseMove);
                document.removeEventListener('mouseup', f_vMouseUp);
                this.f_vUpdateCSSEditor(); // Mise à jour finale
            };

            document.addEventListener('mousemove', f_vMouseMove);
            document.addEventListener('mouseup', f_vMouseUp);
        });
    }

    f_vSetupResizeHandles(p_cElement, p_cDOMElement) {
        // Poignées sur les coins et les bords
        const l_lHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        
        // Vérifier si l'élément a position: absolute/fixed
        const isAbsolute = p_cElement.attributes.style.position === 'absolute' || 
                          p_cElement.attributes.style.position === 'fixed';
        
        l_lHandles.forEach(l_sDirection => {
            const l_cHandle = document.createElement('div');
            l_cHandle.className = `c-resize-handle c-resize-${l_sDirection}`;
            
            l_cHandle.addEventListener('mousedown', (l_cE) => {
                l_cE.stopPropagation();
                l_cE.preventDefault();
                this.G_bIsResizing = true;
                let l_bHasResized = false;
                
                // Convertir les coordonnées de départ dans l'espace du workspace
                const startCoords = this.f_cGetWorkspaceCoords(l_cE.clientX, l_cE.clientY);
                const l_iStartX = startCoords.x;
                const l_iStartY = startCoords.y;
                const l_iInitialWidth = parseInt(p_cElement.attributes.style.width) || p_cDOMElement.offsetWidth;
                const l_iInitialHeight = parseInt(p_cElement.attributes.style.height) || p_cDOMElement.offsetHeight;
                const l_iInitialLeft = parseInt(p_cElement.attributes.style.left) || 0;
                const l_iInitialTop = parseInt(p_cElement.attributes.style.top) || 0;

                const f_vMouseMove = (l_cE) => {
                    if(!this.G_bIsResizing) return;
                    
                    // Convertir les coordonnées actuelles dans l'espace du workspace
                    const currentCoords = this.f_cGetWorkspaceCoords(l_cE.clientX, l_cE.clientY);
                    const l_iDeltaX = currentCoords.x - l_iStartX;
                    const l_iDeltaY = currentCoords.y - l_iStartY;
                    
                    // Redimensionnement horizontal (Est/Ouest)
                    if(l_sDirection === 'e' || l_sDirection === 'ne' || l_sDirection === 'se') {
                        const newWidth = Math.max(50, l_iInitialWidth + l_iDeltaX);
                        if(newWidth !== l_iInitialWidth) l_bHasResized = true;
                        p_cElement.attributes.style.width = newWidth + 'px';
                    }
                    if(l_sDirection === 'w' || l_sDirection === 'nw' || l_sDirection === 'sw') {
                        const newWidth = Math.max(50, l_iInitialWidth - l_iDeltaX);
                        if(newWidth !== l_iInitialWidth) l_bHasResized = true;
                        p_cElement.attributes.style.width = newWidth + 'px';
                        // Seulement ajuster left pour les éléments absolute
                        if(isAbsolute) {
                            p_cElement.attributes.style.left = (l_iInitialLeft + (l_iInitialWidth - newWidth)) + 'px';
                        }
                    }
                    
                    // Redimensionnement vertical (Nord/Sud)
                    if(l_sDirection === 's' || l_sDirection === 'se' || l_sDirection === 'sw') {
                        const newHeight = Math.max(30, l_iInitialHeight + l_iDeltaY);
                        if(newHeight !== l_iInitialHeight) l_bHasResized = true;
                        p_cElement.attributes.style.height = newHeight + 'px';
                    }
                    if(l_sDirection === 'n' || l_sDirection === 'ne' || l_sDirection === 'nw') {
                        const newHeight = Math.max(30, l_iInitialHeight - l_iDeltaY);
                        if(newHeight !== l_iInitialHeight) l_bHasResized = true;
                        p_cElement.attributes.style.height = newHeight + 'px';
                        // Seulement ajuster top pour les éléments absolute
                        if(isAbsolute) {
                            p_cElement.attributes.style.top = (l_iInitialTop + (l_iInitialHeight - newHeight)) + 'px';
                        }
                    }
                    
                    this.f_vRenderAll();
                    this.f_vUpdateCSSEditor(); // Mise à jour en temps réel
                };

                const f_vMouseUp = () => {
                    this.G_bIsResizing = false;
                    if(l_bHasResized) {
                        this.f_vSaveHistory(); // Sauvegarder après le redimensionnement
                    }
                    document.removeEventListener('mousemove', f_vMouseMove);
                    document.removeEventListener('mouseup', f_vMouseUp);
                    this.f_vUpdateCSSEditor(); // Mise à jour finale
                };

                document.addEventListener('mousemove', f_vMouseMove);
                document.addEventListener('mouseup', f_vMouseUp);
            });
            
            p_cDOMElement.appendChild(l_cHandle);
        });
    }

    f_vRenderAll() {
        const l_cWorkspace = document.getElementById('G_sWorkspace');
        l_cWorkspace.innerHTML = '';
        
        // Toujours afficher le rendu final (mode flow activé)
        l_cWorkspace.classList.remove('absolute-mode');
        l_cWorkspace.classList.add('flow-mode');
        
        // Appliquer les styles du body au workspace
        if(this.G_cBodyElement && this.G_cBodyElement.attributes.style) {
            Object.assign(l_cWorkspace.style, this.G_cBodyElement.attributes.style);
        }
        
        this.G_lElements.forEach(l_cEl => this.f_vRenderElement(l_cEl, l_cWorkspace));
        this.f_vRenderTree();
        this.f_vUpdateElementCount();
        
        // Afficher l'état vide si nécessaire (mode composant sans éléments)
        this.f_vUpdateWorkspaceEmptyState();
        
        // NE PAS exécuter les actions "load" dans l'éditeur
        // Elles seront exécutées uniquement dans l'export
    }
    
    f_vUpdateWorkspaceEmptyState() {
        const workspace = document.getElementById('G_sWorkspace');
        const emptyState = document.getElementById('G_sWorkspaceEmpty');
        const emptyIcon = document.getElementById('G_sEmptyIcon');
        const emptyTitle = document.getElementById('G_sEmptyTitle');
        const emptyDescription = document.getElementById('G_sEmptyDescription');
        const emptyAction = document.getElementById('G_sEmptyAction');
        
    // Afficher l'état vide UNIQUEMENT si mode composant, aucun élément et aucun composant chargé
    // Dès qu'un composant est en cours d'édition ou que des éléments existent, on affiche le workspace
    if(this.G_bComponentCreationMode && this.G_lElements.length === 0 && !this.G_cCurrentComponent) {
            // Adapter le message pour le mode composant
            if(emptyIcon) emptyIcon.textContent = '🧩';
            if(emptyTitle) emptyTitle.textContent = 'Aucun composant en cours d\'édition';
            if(emptyDescription) emptyDescription.textContent = 'Sélectionnez un composant existant ou créez-en un nouveau pour commencer.';
            if(emptyAction) {
                emptyAction.textContent = '+ Nouveau Composant';
                emptyAction.onclick = () => this.f_vCreateNewComponent();
            }
            
            if(workspace) workspace.style.display = 'none';
            if(emptyState) emptyState.style.display = 'flex';
        } else {
            // Masquer l'état vide et afficher le workspace
            if(workspace) workspace.style.display = '';
            if(emptyState) emptyState.style.display = 'none';
            
            // Restaurer le message par défaut pour les pages (au cas où on revient)
            if(emptyIcon) emptyIcon.textContent = '📄';
            if(emptyTitle) emptyTitle.textContent = 'Aucune page disponible';
            if(emptyDescription) emptyDescription.textContent = 'Créez votre première page pour commencer à concevoir votre site.';
            if(emptyAction) {
                emptyAction.textContent = '+ Nouvelle page';
                emptyAction.onclick = () => this.f_vCreatePage();
            }
        }
    }
    
    f_vUpdateElementCount() {
        const countElement = document.getElementById('G_sElementCount');
        if(countElement) {
            const count = this.f_iCountAllElements();
            countElement.textContent = count;
        }
    }
    
    f_iCountAllElements() {
        let count = 0;
        const countRecursive = (elements) => {
            elements.forEach(el => {
                count++;
                if(el.children && el.children.length > 0) {
                    countRecursive(el.children);
                }
            });
        };
        countRecursive(this.G_lElements);
        return count;
    }

    f_vRenderElement(p_cElement, p_cParent) {
        const l_cDiv = document.createElement(p_cElement.type);
        l_cDiv.id = p_cElement.id;
        l_cDiv.className = 'c-element ' + (p_cElement.attributes.className || '');
        
        // Appliquer les styles directement (rendu final)
        const appliedStyles = {...p_cElement.attributes.style};
        Object.assign(l_cDiv.style, appliedStyles);
        l_cDiv.innerHTML = p_cElement.attributes.innerHTML || '';
        
        const computedPosition = (appliedStyles.position || '').toLowerCase();
        const isAbsoluteOrFixed = computedPosition === 'absolute' || computedPosition === 'fixed';

        // Vérifier si cet élément est sélectionné (sélection unique ou multi-sélection)
        const isSelected = this.G_cSelectedElement?.id === p_cElement.id || 
                          this.G_lSelectedElements.some(el => el.id === p_cElement.id);
        
        if(isSelected) {
            l_cDiv.classList.add('selected');

            // S'assurer que les éléments non positionnés disposent d'un contexte pour les poignées
            if(!isAbsoluteOrFixed && computedPosition !== 'relative' && computedPosition !== 'sticky') {
                l_cDiv.style.position = 'relative';
            }
            
            // Ajouter les poignées de resize pour TOUS les éléments sélectionnés
            // (absolute ou non - le resize fonctionne avec width/height)
            this.f_vSetupResizeHandles(p_cElement, l_cDiv);
        }
        
        // Toujours configurer la sélection ; le drag ne sera actif que pour les éléments absolute/fixed
        this.f_vSetupElementDrag(p_cElement, l_cDiv);
        
        // Permettre le drop dans les DIV et autres conteneurs
        if(['div', 'form', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav'].includes(p_cElement.type)) {
            this.f_vSetupElementDrop(p_cElement, l_cDiv);
        }

        // NE PAS setup les actions API dans l'éditeur (uniquement dans l'export)
        // Les actions seront ajoutées lors de l'export via data-api

        p_cParent.appendChild(l_cDiv);
        p_cElement.children.forEach(l_cChild => this.f_vRenderElement(l_cChild, l_cDiv));
    }

    f_vSetupElementDrop(p_cElement, p_cDOMElement) {
        p_cDOMElement.addEventListener('dragover', (e) => {
            if(this.G_cDraggedComponent || this.G_cDraggedTemplate) {
                e.preventDefault();
                e.stopPropagation();
                p_cDOMElement.style.outline = '2px dashed #28a745';
            }
        });

        p_cDOMElement.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            p_cDOMElement.style.outline = '';
        });

        p_cDOMElement.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            p_cDOMElement.style.outline = '';
            
            if(this.G_cDraggedComponent || this.G_cDraggedTemplate) {
                const l_sId = 'el-' + this.G_iCounter++;
                
                let l_cNewElement;
                if(this.G_cDraggedTemplate) {
                    // Remplacer espaces par tirets pour un type valide
                    const l_sType = this.G_cDraggedTemplate.name.toLowerCase().replace(/\s+/g, '-');
                    l_cNewElement = new C_Element(l_sType, l_sId, this.G_cDraggedTemplate);
                } else {
                    l_cNewElement = new C_Element(this.G_cDraggedComponent, l_sId);
                }
                
                // Positionner en relatif dans le conteneur
                l_cNewElement.attributes.style.position = 'relative';
                l_cNewElement.attributes.style.left = '0px';
                l_cNewElement.attributes.style.top = '0px';
                
                // Ajouter comme enfant
                p_cElement.F_vAddChild(l_cNewElement);
                
                // Sauvegarder dans la page courante
                if (this.G_cCurrentPage) {
                    this.G_cCurrentPage.elements = this.G_lElements.map(e =>
                        typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
                    );
                }
                
                this.f_vRenderAll();
                this.f_vRenderTree();
                this.G_cDraggedComponent = null;
                this.G_cDraggedTemplate = null;

                // Rafraîchir le graph si ouvert
                if (window.G_cGraphVisualizer && document.getElementById('G_sGraphPopup').style.display === 'flex') {
                    window.G_cGraphVisualizer.F_vRefresh();
                }
            }
        });
    }

    f_vRenderTree() {
        const l_cTree = document.getElementById('G_sTreeView');
        
        // Titre différent selon le mode
        const treeTitle = this.G_bComponentCreationMode 
            ? '<h3 style="margin-bottom: 10px; color: #0078d4;"><i class="fas fa-cube"></i> Composants de l\'élément</h3>'
            : '<h3 style="margin-bottom: 10px; color: #0078d4;"><i class="fas fa-sitemap"></i> Arborescence</h3>';
        
        l_cTree.innerHTML = `
            ${treeTitle}
            <div id="body-tree-item" class="c-tree-item" style="padding: 8px; margin-bottom: 10px; background: ${this.G_cSelectedElement?.id === 'body' ? '#2d5016' : '#2a2a2a'}; border-left: 3px solid #00ff00; cursor: pointer; border-radius: 3px;" onclick="G_cApp.f_vSelectBody()">
                <span style="font-weight: bold; color: #00ff00;"><i class="fas fa-file-code"></i> ${this.G_bComponentCreationMode ? 'Conteneur' : 'body'}</span>
            </div>
            <div id="G_sTreeRoot" class="c-tree-root" style="padding: 10px; background: #1a1a1a; border: 2px dashed #555; border-radius: 4px; margin-bottom: 10px; text-align: center; color: #999;">
                <i class="fas fa-home"></i> Racine (glissez ici pour extraire)
            </div>
        `;
        this.G_lElements.forEach(l_cEl => this.f_vRenderTreeItem(l_cEl, l_cTree, 0));
        this.f_vSetupTreeDragDrop();
    }

    f_vSelectBody() {
        this.G_cSelectedElement = this.G_cBodyElement;
        this.G_lSelectedElements = [];
        this.f_vRenderAll();
        this.f_vRenderProperties();
        this.f_vRenderTree();
    }

    f_vRenderTreeItem(p_cElement, p_cParent, p_iLevel) {
        const l_cDiv = document.createElement('div');
        l_cDiv.className = 'c-tree-item' + (this.G_cSelectedElement?.id === p_cElement.id ? ' selected' : '');
        l_cDiv.dataset.elementId = p_cElement.id;
        l_cDiv.draggable = true;
        
        const isCollapsed = this.G_cCollapsedTreeItems.has(p_cElement.id);
        const hasChildren = p_cElement.children.length > 0;
        const l_sIcon = hasChildren ? '<i class="fas fa-folder"></i>' : this.f_sGetElementIcon(p_cElement.type);
        const toggleIcon = hasChildren ? (isCollapsed ? '<i class="fas fa-caret-right"></i>' : '<i class="fas fa-caret-down"></i>') : '<i class="fas fa-circle" style="font-size: 6px;"></i>';
        
        l_cDiv.innerHTML = `
            <span class="c-tree-toggle" style="cursor: pointer; user-select: none; display: inline-block; width: 20px;">${toggleIcon}</span>
            <div class="c-tree-item-content" style="display: inline-block;">
                <span>${l_sIcon}</span>
                <span>${p_cElement.type}</span>
                <span class="c-tree-item-type">${p_cElement.id}</span>
            </div>
        `;
        
        // Toggle pour plier/déplier
        const toggleSpan = l_cDiv.querySelector('.c-tree-toggle');
        if(hasChildren) {
            toggleSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                if(this.G_cCollapsedTreeItems.has(p_cElement.id)) {
                    this.G_cCollapsedTreeItems.delete(p_cElement.id);
                } else {
                    this.G_cCollapsedTreeItems.add(p_cElement.id);
                }
                this.f_vRenderTree();
            });
        }
        
        // Sélection de l'élément
        const contentDiv = l_cDiv.querySelector('.c-tree-item-content');
        contentDiv.addEventListener('click', (l_cE) => {
            l_cE.stopPropagation();
            this.F_vSelectElement(p_cElement, l_cE.ctrlKey || l_cE.metaKey);
        });

        p_cParent.appendChild(l_cDiv);
        
        if(p_cElement.children.length > 0 && !isCollapsed) {
            const l_cChildren = document.createElement('div');
            l_cChildren.className = 'c-tree-children';
            p_cElement.children.forEach(l_cChild => this.f_vRenderTreeItem(l_cChild, l_cChildren, p_iLevel + 1));
            p_cParent.appendChild(l_cChildren);
        }
    }

    f_sGetElementIcon(p_sType) {
        const icons = {
            'div': '<i class="fas fa-square"></i>',
            'button': '<i class="fas fa-hand-pointer"></i>',
            'input': '<i class="fas fa-edit"></i>',
            'textarea': '<i class="fas fa-align-left"></i>',
            'select': '<i class="fas fa-list"></i>',
            'p': '<i class="fas fa-paragraph"></i>',
            'h1': '<i class="fas fa-heading"></i>',
            'h2': '<i class="fas fa-heading"></i>',
            'h3': '<i class="fas fa-heading"></i>',
            'img': '<i class="fas fa-image"></i>',
            'form': '<i class="fas fa-wpforms"></i>',
            'ul': '<i class="fas fa-list-ul"></i>',
            'table': '<i class="fas fa-table"></i>',
            'a': '<i class="fas fa-link"></i>',
            'card': '<i class="fas fa-id-card"></i>',
            'navbar': '<i class="fas fa-bars"></i>',
            'modal': '<i class="fas fa-window-restore"></i>',
            'datatable': '<i class="fas fa-table"></i>'
        };
        return icons[p_sType] || '<i class="fas fa-file"></i>';
    }

    f_vSetupTreeDragDrop() {
        // Configuration de la zone racine
        const rootZone = document.getElementById('G_sTreeRoot');
        if(rootZone) {
            rootZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if(this.G_cDraggedTreeElement && this.G_cDraggedTreeElement.parent) {
                    rootZone.style.borderColor = '#0078d4';
                    rootZone.style.background = '#2a2a2a';
                }
            });

            rootZone.addEventListener('dragleave', (e) => {
                rootZone.style.borderColor = '#555';
                rootZone.style.background = '#1a1a1a';
            });

            rootZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                rootZone.style.borderColor = '#555';
                rootZone.style.background = '#1a1a1a';
                
                if(this.G_cDraggedTreeElement && this.G_cDraggedTreeElement.parent) {
                    this.F_vExtractFromParent(this.G_cDraggedTreeElement);
                }
                
                this.G_cDraggedTreeElement = null;
            });
        }

        const treeItems = document.querySelectorAll('.c-tree-item');
        
        treeItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const elementId = e.target.dataset.elementId;
                this.G_cDraggedTreeElement = this.f_cFindElementById(elementId);
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const elementId = e.currentTarget.dataset.elementId;
                const targetElement = this.f_cFindElementById(elementId);
                
                // Ne pas permettre de glisser un élément dans lui-même ou ses enfants
                if(this.G_cDraggedTreeElement && !this.f_bIsDescendant(targetElement, this.G_cDraggedTreeElement)) {
                    e.currentTarget.classList.add('c-drag-over');
                }
            });

            item.addEventListener('dragleave', (e) => {
                e.currentTarget.classList.remove('c-drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('c-drag-over');
                
                const targetId = e.currentTarget.dataset.elementId;
                const targetElement = this.f_cFindElementById(targetId);
                
                if(this.G_cDraggedTreeElement && targetElement && 
                    !this.f_bIsDescendant(targetElement, this.G_cDraggedTreeElement)) {
                    this.f_vMoveElementToParent(this.G_cDraggedTreeElement, targetElement);
                }
                
                this.G_cDraggedTreeElement = null;
            });
        });
    }

    f_cFindElementById(p_sId) {
        const find = (elements) => {
            for(let el of elements) {
                if(el.id === p_sId) return el;
                const found = find(el.children);
                if(found) return found;
            }
            return null;
        };
        return find(this.G_lElements);
    }

    f_bIsDescendant(p_cPotentialChild, p_cPotentialParent) {
        if(p_cPotentialChild.id === p_cPotentialParent.id) return true;
        for(let child of p_cPotentialParent.children) {
            if(this.f_bIsDescendant(p_cPotentialChild, child)) return true;
        }
        return false;
    }

    f_vMoveElementToParent(p_cElement, p_cNewParent) {
        // Retirer de l'ancien parent
        if(p_cElement.parent) {
            p_cElement.parent.F_vRemoveChild(p_cElement);
        } else {
            this.G_lElements = this.G_lElements.filter(el => el.id !== p_cElement.id);
        }
        
        // Ajouter au nouveau parent
        p_cNewParent.F_vAddChild(p_cElement);
        
        // Rafraîchir
        this.f_vRenderAll();
        this.f_vRenderTree();
    }

    f_vUpdateCSSEditor() {
        // Mettre à jour l'éditeur CSS si un élément est sélectionné
        if(!this.G_cSelectedElement) return;
        
        // Mettre à jour la liste des propriétés CSS
        this.f_vRenderCSSProperties();
    }

    F_vSelectElement(p_cElement, p_bCtrlKey = false) {
        // Si Ctrl est pressé, gérer la multi-sélection
        if(p_bCtrlKey) {
            // Si déjà en multi-sélection
            if(this.G_lSelectedElements.length > 0) {
                const index = this.G_lSelectedElements.indexOf(p_cElement);
                if(index > -1) {
                    // Désélectionner cet élément
                    this.G_lSelectedElements.splice(index, 1);
                    const domElement = document.getElementById(p_cElement.id);
                    if(domElement) {
                        domElement.classList.remove('multi-selected');
                    }
                } else {
                    // Ajouter à la sélection
                    this.G_lSelectedElements.push(p_cElement);
                    const domElement = document.getElementById(p_cElement.id);
                    if(domElement) {
                        domElement.classList.add('multi-selected');
                    }
                }
            } else if(this.G_cSelectedElement) {
                // Convertir la sélection unique en multi-sélection
                const prevElement = this.G_cSelectedElement;
                const prevDom = document.getElementById(prevElement.id);
                if(prevDom) {
                    prevDom.classList.remove('selected');
                    prevDom.classList.add('multi-selected');
                }
                
                this.G_lSelectedElements = [prevElement, p_cElement];
                this.G_cSelectedElement = null;
                
                const domElement = document.getElementById(p_cElement.id);
                if(domElement) {
                    domElement.classList.add('multi-selected');
                }
                
                // Cacher le panneau de propriétés en multi-sélection
                document.getElementById('G_sProperties').style.display = 'none';
            } else {
                // Première sélection avec Ctrl
                this.G_lSelectedElements = [p_cElement];
                const domElement = document.getElementById(p_cElement.id);
                if(domElement) {
                    domElement.classList.add('multi-selected');
                }
                document.getElementById('G_sProperties').style.display = 'none';
            }
            return;
        }
        
        // Sélection normale (désactiver la multi-sélection)
        this.f_vDeselectAll();
        
        this.G_cSelectedElement = p_cElement;
        this.f_vRenderAll();
        this.f_vRenderProperties();
    }

    f_bIsElementSelected(p_cElement) {
        if(!p_cElement) return false;
        if(this.G_cSelectedElement && this.G_cSelectedElement.id === p_cElement.id) {
            return true;
        }
        return this.G_lSelectedElements.some(el => el.id === p_cElement.id);
    }

    f_bHasSelectedAncestor(p_cElement) {
        if(!p_cElement) return false;
        if(this.G_cSelectedElement && this.f_bIsAncestorElement(this.G_cSelectedElement, p_cElement)) {
            return true;
        }
        return this.G_lSelectedElements.some(el => this.f_bIsAncestorElement(el, p_cElement));
    }

    f_bIsAncestorElement(potentialAncestor, potentialDescendant) {
        if(!potentialAncestor || !potentialDescendant) return false;
        if(potentialAncestor.id === potentialDescendant.id) return false;
        let current = potentialDescendant.parent;
        while(current) {
            if(current.id === potentialAncestor.id) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    f_vRenderProperties() {
        const l_cPanel = document.getElementById('G_sProperties');
        if(!this.G_cSelectedElement) {
            l_cPanel.innerHTML = '<p style="color: #666;">Sélectionnez un élément</p>';
            return;
        }

        // Cas spécial pour le body
        const isBody = this.G_cSelectedElement.id === 'body';

        // Initialiser les pseudo-styles si nécessaire
        if(!this.G_cSelectedElement.pseudoStyles) {
            this.G_cSelectedElement.pseudoStyles = {
                hover: {},
                active: {},
                focus: {},
                before: {},
                after: {}
            };
        }

        const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
        const l_sStyleCSS = l_sCurrentPseudo === 'normal' 
            ? Object.entries(this.G_cSelectedElement.attributes.style).map(([k, v]) => `${k}: ${v};`).join('\n')
            : Object.entries(this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo] || {}).map(([k, v]) => `${k}: ${v};`).join('\n');

        l_cPanel.innerHTML = `
            <div class="c-property-group">
                <h3>Propriétés</h3>
                <div class="c-property">
                    <label>ID</label>
                    <input type="text" value="${this.G_cSelectedElement.id}" readonly>
                </div>
                <div class="c-property">
                    <label>Type</label>
                    <input type="text" value="${this.G_cSelectedElement.type}" readonly>
                </div>
                ${!isBody ? `
                <div class="c-property">
                    <label>Contenu HTML</label>
                    ${this.G_cSelectedElement.type === 'form' ? 
                        `<button class="c-btn" onclick="G_cApp.f_vOpenFormEditor()" style="width: 100%; margin-bottom: 10px;"><i class="fas fa-edit"></i> Éditeur Visuel de Formulaire</button>` : 
                        ''
                    }
                    <div id="l_sInnerHTMLContainer"></div>
                </div>
                <div class="c-property">
                    <label>Classe CSS</label>
                    <input type="text" id="l_sClassName" value="${this.G_cSelectedElement.attributes.className || ''}">
                </div>
                ` : ''}
            </div>
            <div class="c-property-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0;">État CSS</h3>
                    <label class="c-toggle-switch" title="Basculer entre éditeur et texte brut">
                        <input type="checkbox" ${this.G_bCSSRawMode ? 'checked' : ''} onchange="G_cApp.f_vToggleCSSMode()">
                        <span class="c-toggle-slider"></span>
                    </label>
                </div>
                <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px;">
                    <button class="c-pseudo-tab ${l_sCurrentPseudo === 'normal' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('normal')">Normal</button>
                    <button class="c-pseudo-tab ${l_sCurrentPseudo === 'hover' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('hover')">:hover</button>
                    <button class="c-pseudo-tab ${l_sCurrentPseudo === 'active' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('active')">:active</button>
                    <button class="c-pseudo-tab ${l_sCurrentPseudo === 'focus' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('focus')">:focus</button>
                    <button class="c-pseudo-tab ${l_sCurrentPseudo === 'before' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('before')">::before</button>
                    <button class="c-pseudo-tab ${l_sCurrentPseudo === 'after' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('after')">::after</button>
                </div>
                <div id="G_sCSSPropertiesList"></div>
                <div id="G_sCSSRawEditor" style="display: none;"></div>
                <button id="G_sAddCSSBtn" class="c-btn c-btn-add" onclick="G_cApp.f_vAddCSSProperty()" style="width: 100%; margin-top: 10px;">+ Ajouter une propriété CSS</button>
            </div>
            ${!isBody ? `
            <div class="c-property-group">
                <h3>Actions</h3>
                <button class="c-btn" onclick="G_cApp.F_vOpenAPIModal()">Gérer Actions API (${this.G_cSelectedElement.apiActions?.length || 0})</button>
                ${this.G_cSelectedElement.parent ? '<button class="c-btn" style="background: #28a745; margin-top: 10px;" onclick="G_cApp.F_vExtractFromParent()"><i class="fas fa-arrow-up"></i> Extraire du parent</button>' : ''}
                <button class="c-btn" style="background: #d13438; margin-top: 10px;" onclick="G_cApp.F_vDeleteElement()"><i class="fas fa-trash"></i> Supprimer</button>
            </div>
            ` : ''}
            ${!isBody && this.G_lPages && this.G_lPages.length > 0 ? this.f_vShowNavigationActions(this.G_cSelectedElement) : ''}
        `;

        // Ajouter les event listeners seulement si les éléments existent (pas pour le body)
        const innerHTMLContainer = document.getElementById('l_sInnerHTMLContainer');
        const classNameInput = document.getElementById('l_sClassName');
        
        if(innerHTMLContainer) {
            // Créer un éditeur avec coloration syntaxique HTML
            const currentHTML = this.G_cSelectedElement.attributes.innerHTML || '';
            
            if(!this.G_cHTMLEditor || !innerHTMLContainer.querySelector('.c-syntax-editor-container')) {
                // Vider le conteneur
                innerHTMLContainer.innerHTML = '';
                
                // Créer le highlighter HTML
                const htmlHighlighter = new C_SyntaxHighlighter('html');
                const htmlEditor = htmlHighlighter.f_cCreateEditor('l_sInnerHTMLContainer', currentHTML, {
                    placeholder: 'Entrez votre HTML ici...',
                    tabSize: 2,
                    minHeight: '100px'
                });
                
                // Stocker la référence à l'éditeur
                this.G_cHTMLEditor = htmlEditor;
                
                // Ajouter un event listener pour sauvegarder lors de la modification
                htmlEditor.textarea.addEventListener('input', (e) => {
                    this.G_cSelectedElement.attributes.innerHTML = e.target.value;
                    this.f_vRenderAll();
                });
            } else {
                // Mettre à jour juste la valeur si l'éditeur existe déjà
                this.G_cHTMLEditor.textarea.value = currentHTML;
                // Déclencher manuellement la mise à jour de la coloration
                this.G_cHTMLEditor.textarea.dispatchEvent(new Event('input'));
            }
        }
        
        if(classNameInput) {
            classNameInput.addEventListener('input', (e) => {
                this.G_cSelectedElement.attributes.className = e.target.value;
                this.f_vRenderAll();
            });
        }

        // Rendre la liste CSS
        this.f_vRenderCSSProperties();
    }

    f_vRenderCSSProperties() {
        const container = document.getElementById('G_sCSSPropertiesList');
        const rawEditor = document.getElementById('G_sCSSRawEditor');
        const addBtn = document.getElementById('G_sAddCSSBtn');
        
        if(!container || !rawEditor) return;

        // Afficher/masquer selon le mode
        if(this.G_bCSSRawMode) {
            container.style.display = 'none';
            rawEditor.style.display = 'block';
            if(addBtn) addBtn.style.display = 'none';
            this.f_vUpdateRawCSSFromStyles();
        } else {
            container.style.display = 'block';
            rawEditor.style.display = 'none';
            if(addBtn) addBtn.style.display = 'block';
            
            const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
            const styles = l_sCurrentPseudo === 'normal' 
                ? this.G_cSelectedElement.attributes.style 
                : (this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo] || {});

            let html = '';
            const entries = Object.entries(styles);

            entries.forEach(([key, value], idx) => {
                html += `
                    <div class="c-css-property-item" style="display: flex; gap: 5px; margin-bottom: 8px; align-items: center;">
                        <input type="text" value="${key}" 
                                placeholder="propriété" 
                                style="flex: 1; padding: 6px; font-size: 11px;"
                                onchange="G_cApp.f_vUpdateCSSPropertyKey('${key}', this.value)">
                        <input type="text" value="${value}" 
                                placeholder="valeur" 
                                style="flex: 2; padding: 6px; font-size: 11px;"
                                oninput="G_cApp.f_vUpdateCSSPropertyValue('${key}', this.value)"
                                onchange="G_cApp.f_vSaveHistory()">
                        <button class="c-btn-small" onclick="G_cApp.f_vDeleteCSSProperty('${key}')" style="padding: 6px 8px;">×</button>
                    </div>
                `;
            });

            if(entries.length === 0) {
                html = '<p style="color: #666; font-size: 12px; text-align: center; padding: 10px;">Aucune propriété CSS</p>';
            }

            container.innerHTML = html;
        }
    }

    f_vAddCSSProperty() {
        const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
        const styles = l_sCurrentPseudo === 'normal' 
            ? this.G_cSelectedElement.attributes.style 
            : this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo];

        // Trouver un nom de propriété unique
        let propName = 'newProperty';
        let counter = 1;
        while(styles[propName]) {
            propName = `newProperty${counter}`;
            counter++;
        }

        styles[propName] = 'value';
        this.f_vRenderCSSProperties();
        this.f_vRenderAll();
    }

    f_vUpdateCSSPropertyKey(p_sOldKey, p_sNewKey) {
        const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
        const styles = l_sCurrentPseudo === 'normal' 
            ? this.G_cSelectedElement.attributes.style 
            : this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo];

        if(p_sOldKey !== p_sNewKey && p_sNewKey.trim()) {
            const value = styles[p_sOldKey];
            delete styles[p_sOldKey];
            styles[p_sNewKey] = value;
            
            // Nettoyer toutes les propriétés undefined (résidus de frappe)
            Object.keys(styles).forEach(key => {
                if(styles[key] === undefined || styles[key] === 'undefined') {
                    delete styles[key];
                }
            });
            
            this.f_vSaveHistory(); // Sauvegarder après modification
            this.f_vRenderCSSProperties();
            this.f_vRenderAll();
        }
    }

    f_vUpdateCSSPropertyValue(p_sKey, p_sNewValue) {
        const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
        const styles = l_sCurrentPseudo === 'normal' 
            ? this.G_cSelectedElement.attributes.style 
            : this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo];

        styles[p_sKey] = p_sNewValue;
        
        // Nettoyer les propriétés undefined
        Object.keys(styles).forEach(key => {
            if(styles[key] === undefined || styles[key] === 'undefined') {
                delete styles[key];
            }
        });
        
        // Mise à jour en temps réel sans re-render de la liste
        this.f_vRenderAll();
    }

    f_vDeleteCSSProperty(p_sKey) {
        const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
        const styles = l_sCurrentPseudo === 'normal' 
            ? this.G_cSelectedElement.attributes.style 
            : this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo];

        delete styles[p_sKey];
        this.f_vSaveHistory(); // Sauvegarder après suppression
        this.f_vRenderCSSProperties();
        this.f_vRenderAll();
    }

    f_vSelectPseudo(p_sPseudo) {
        this.G_cSelectedPseudo = p_sPseudo;
        this.f_vRenderProperties();
    }

    f_vToggleCSSMode() {
        this.G_bCSSRawMode = !this.G_bCSSRawMode;
        
        if(this.G_bCSSRawMode) {
            // Passer en mode texte brut
            this.f_vUpdateRawCSSFromStyles();
        } else {
            // Passer en mode éditeur - sauvegarder le texte brut
            this.f_vUpdateStylesFromRawCSS();
        }
        
        this.f_vRenderProperties();
    }

    f_vUpdateRawCSSFromStyles() {
        // Convertir les styles en texte CSS brut
        const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
        const styles = l_sCurrentPseudo === 'normal' 
            ? this.G_cSelectedElement.attributes.style 
            : (this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo] || {});
        
        let cssText = '';
        for(let [key, value] of Object.entries(styles)) {
            if(value === undefined || value === 'undefined' || value === '') continue;
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            cssText += `${cssKey}: ${value};\n`;
        }
        
        // Créer l'éditeur avec coloration syntaxique seulement si pas déjà créé
        const container = document.getElementById('G_sCSSRawEditor');
        if(container) {
            if(!this.G_cCSSEditor || !container.querySelector('.c-syntax-editor-container')) {
                // Vider le conteneur
                container.innerHTML = '';
                
                // Créer le highlighter CSS
                const cssHighlighter = new C_SyntaxHighlighter('css');
                const cssEditor = cssHighlighter.f_cCreateEditor('G_sCSSRawEditor', cssText, {
                    placeholder: 'Entrez votre CSS ici...',
                    tabSize: 2
                });
                
                // Stocker la référence à l'éditeur
                this.G_cCSSEditor = cssEditor;
                
                // Ajouter un event listener pour sauvegarder lors de la modification
                cssEditor.textarea.addEventListener('input', () => {
                    this.f_vUpdateStylesFromRawCSS();
                });
            } else {
                // Mettre à jour juste la valeur si l'éditeur existe déjà
                this.G_cCSSEditor.textarea.value = cssText;
                // Déclencher manuellement la mise à jour de la coloration
                this.G_cCSSEditor.textarea.dispatchEvent(new Event('input'));
            }
        }
    }

    f_vUpdateStylesFromRawCSS() {
        // Récupérer le texte depuis l'éditeur
        if(!this.G_cCSSEditor) return;
        
        const cssText = this.G_cCSSEditor.textarea.value;
        const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
        const styles = l_sCurrentPseudo === 'normal' 
            ? this.G_cSelectedElement.attributes.style 
            : this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo];
        
        // Vider les styles actuels
        Object.keys(styles).forEach(key => delete styles[key]);
        
        // Parser le CSS brut
        const lines = cssText.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if(!line || !line.includes(':')) return;
            
            const [property, ...valueParts] = line.split(':');
            let value = valueParts.join(':').trim();
            
            // Enlever le point-virgule final
            if(value.endsWith(';')) {
                value = value.slice(0, -1).trim();
            }
            
            // Convertir kebab-case en camelCase
            const camelProperty = property.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            
            if(camelProperty && value) {
                styles[camelProperty] = value;
            }
        });
        
        this.f_vRenderAll();
    }

    f_vCleanupAllStyles() {
        // Nettoyer toutes les propriétés undefined de tous les éléments
        const cleanStyles = (styles) => {
            if(!styles) return;
            Object.keys(styles).forEach(key => {
                if(styles[key] === undefined || styles[key] === 'undefined' || styles[key] === '') {
                    delete styles[key];
                }
            });
        };

        const cleanElement = (el) => {
            if(el.attributes && el.attributes.style) {
                cleanStyles(el.attributes.style);
            }
            if(el.pseudoStyles) {
                Object.values(el.pseudoStyles).forEach(styles => cleanStyles(styles));
            }
            if(el.children) {
                el.children.forEach(child => cleanElement(child));
            }
        };

        this.G_lElements.forEach(el => cleanElement(el));
    }

    F_vOpenAPIModal() {
        if(!this.G_cSelectedElement.apiActions) {
            this.G_cSelectedElement.apiActions = [];
        }
        this.f_vRenderAPIModal();
        document.getElementById('G_sAPIModal').style.display = 'block';
    }

    f_vRenderAPIModal() {
        const list = document.getElementById('G_sAPIActionsList');
        let html = '';

        this.G_cSelectedElement.apiActions.forEach((action, idx) => {
            const isGetOrHead = action.method === 'GET' || action.method === 'HEAD';
            const isBackend = action.mode === 'backend';
            html += `
                <div class="c-api-action">
                    <div class="c-api-action-header">
                        <span class="c-api-action-title">Action ${idx + 1}: ${action.event || 'click'}</span>
                        <button class="c-btn-small" onclick="G_cApp.F_vDeleteAPIAction(${idx})">Supprimer</button>
                    </div>
                    <div class="c-property">
                        <label>Événement</label>
                        <select id="action_${idx}_event" onchange="G_cApp.F_vUpdateAction(${idx})">
                            <option value="click" ${action.event === 'click' ? 'selected' : ''}>Click</option>
                            <option value="dblclick" ${action.event === 'dblclick' ? 'selected' : ''}>Double-click</option>
                            <option value="load" ${action.event === 'load' ? 'selected' : ''}>Chargement de la page</option>
                        </select>
                    </div>
                    <div class="c-property">
                        <label>Mode d'exécution</label>
                        <select id="action_${idx}_mode" onchange="G_cApp.F_vUpdateAction(${idx}); G_cApp.f_vToggleModeFields(${idx})">
                            <option value="frontend" ${!action.mode || action.mode === 'frontend' ? 'selected' : ''}>Frontend (affichage)</option>
                            <option value="backend" ${action.mode === 'backend' ? 'selected' : ''}>Backend (sans affichage)</option>
                        </select>
                    </div>
                    <div class="c-property">
                        <label>URL</label>
                        <input type="text" id="action_${idx}_url" value="${action.url || ''}" onchange="G_cApp.F_vUpdateAction(${idx})">
                    </div>
                    <div class="c-property">
                        <label>Méthode</label>
                        <select id="action_${idx}_method" onchange="G_cApp.F_vUpdateAction(${idx}); G_cApp.f_vToggleBodyField(${idx})">
                            <option ${action.method === 'GET' ? 'selected' : ''}>GET</option>
                            <option ${action.method === 'POST' ? 'selected' : ''}>POST</option>
                            <option ${action.method === 'PUT' ? 'selected' : ''}>PUT</option>
                            <option ${action.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
                            <option ${action.method === 'HEAD' ? 'selected' : ''}>HEAD</option>
                        </select>
                    </div>
                    <div class="c-property">
                        <label>Headers (JSON)</label>
                        <textarea id="action_${idx}_headers" onchange="G_cApp.F_vUpdateAction(${idx})">${JSON.stringify(action.headers || {})}</textarea>
                    </div>
                    <div class="c-property" id="action_${idx}_body_container" style="${isGetOrHead ? 'display:none' : ''}">
                        <label>Body (JSON) <small style="color:#999">- Non disponible pour GET/HEAD</small></label>
                        <textarea id="action_${idx}_body" onchange="G_cApp.F_vUpdateAction(${idx})">${JSON.stringify(action.body || {})}</textarea>
                    </div>
                    <div id="action_${idx}_frontend_options" style="${isBackend ? 'display:none' : ''}">
                        <div class="c-property">
                            <label>Action Succès</label>
                            <select id="action_${idx}_successAction" onchange="G_cApp.F_vUpdateAction(${idx})">
                                <option value="popup" ${action.successAction === 'popup' ? 'selected' : ''}>Popup</option>
                                <option value="insert" ${action.successAction === 'insert' ? 'selected' : ''}>Insérer dans div</option>
                                <option value="replace" ${action.successAction === 'replace' ? 'selected' : ''}>Remplacer contenu</option>
                            </select>
                        </div>
                        <div class="c-property">
                            <label>Cible (ID)</label>
                            <input type="text" id="action_${idx}_target" value="${action.target || ''}" onchange="G_cApp.F_vUpdateAction(${idx})">
                        </div>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;
    }

    f_vToggleBodyField(p_iIdx) {
        const method = document.getElementById(`action_${p_iIdx}_method`).value;
        const bodyContainer = document.getElementById(`action_${p_iIdx}_body_container`);
        if(bodyContainer) {
            bodyContainer.style.display = (method === 'GET' || method === 'HEAD') ? 'none' : 'block';
        }
    }

    f_vToggleModeFields(p_iIdx) {
        const mode = document.getElementById(`action_${p_iIdx}_mode`).value;
        const frontendOptions = document.getElementById(`action_${p_iIdx}_frontend_options`);
        if(frontendOptions) {
            frontendOptions.style.display = mode === 'backend' ? 'none' : 'block';
        }
    }

    F_vAddAPIAction() {
        this.G_cSelectedElement.apiActions.push({
            event: 'click',
            url: '',
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: {},
            successAction: 'popup',
            target: ''
        });
        this.f_vRenderAPIModal();
        this.f_vRenderProperties();
    }

    F_vDeleteAPIAction(p_iIdx) {
        this.G_cSelectedElement.apiActions.splice(p_iIdx, 1);
        this.f_vRenderAPIModal();
        this.f_vRenderProperties();
    }

    F_vUpdateAction(p_iIdx) {
        try {
            const action = this.G_cSelectedElement.apiActions[p_iIdx];
            action.event = document.getElementById(`action_${p_iIdx}_event`).value;
            action.mode = document.getElementById(`action_${p_iIdx}_mode`).value;
            action.url = document.getElementById(`action_${p_iIdx}_url`).value;
            action.method = document.getElementById(`action_${p_iIdx}_method`).value;
            action.headers = JSON.parse(document.getElementById(`action_${p_iIdx}_headers`).value);
            action.body = JSON.parse(document.getElementById(`action_${p_iIdx}_body`).value);
            
            // Seulement pour le mode frontend
            if(action.mode !== 'backend') {
                action.successAction = document.getElementById(`action_${p_iIdx}_successAction`).value;
                action.target = document.getElementById(`action_${p_iIdx}_target`).value;
            }
        } catch(e) {
            console.error('Erreur JSON:', e);
        }
    }

    F_vCloseAPIModal() {
        document.getElementById('G_sAPIModal').style.display = 'none';
    }

    F_vDeleteElement() {
        // Supprimer les éléments multi-sélectionnés
        if(this.G_lSelectedElements.length > 0) {
            this.G_lSelectedElements.forEach(element => {
                const f_vRecursiveDelete = (p_cEl) => {
                    p_cEl.children.forEach(l_cChild => f_vRecursiveDelete(l_cChild));
                };
                
                f_vRecursiveDelete(element);
                
                if(element.parent) {
                    element.parent.F_vRemoveChild(element);
                } else {
                    this.G_lElements = this.G_lElements.filter(e => e.id !== element.id);
                }
            });
            
            this.G_lSelectedElements = [];
            this.f_vSaveHistory(); // Sauvegarder dans l'historique
            this.f_vRenderAll();
            this.f_vRenderProperties();
            
            // Rafraîchir les propriétés de page si affichées
            if (this.f_vRefreshPageProperties) {
                this.f_vRefreshPageProperties();
            }
            return;
        }
        
        // Supprimer l'élément unique sélectionné
        if(!this.G_cSelectedElement) return;
        
        const f_vRecursiveDelete = (p_cEl) => {
            p_cEl.children.forEach(l_cChild => f_vRecursiveDelete(l_cChild));
        };
        
        f_vRecursiveDelete(this.G_cSelectedElement);
        
        if(this.G_cSelectedElement.parent) {
            this.G_cSelectedElement.parent.F_vRemoveChild(this.G_cSelectedElement);
        } else {
            this.G_lElements = this.G_lElements.filter(e => e.id !== this.G_cSelectedElement.id);
        }
        
        this.G_cSelectedElement = null;
        this.f_vSaveHistory(); // Sauvegarder dans l'historique
        this.f_vRenderAll();
        this.f_vRenderProperties();
        
        // Rafraîchir les propriétés de page si affichées
        if (this.f_vRefreshPageProperties) {
            this.f_vRefreshPageProperties();
        }
    }

    // ========== ÉDITEUR DE FORMULAIRE ==========

    f_vOpenFormEditor() {
        if(!this.G_lFormFields) {
            this.G_lFormFields = this.f_lParseFormHTML();
        }
        this.f_vRenderFormEditor();
        document.getElementById('G_sFormEditorModal').style.display = 'block';
    }

    f_lParseFormHTML() {
        // Parser le HTML actuel pour extraire les champs
        const html = this.G_cSelectedElement.attributes.innerHTML || '';
        const fields = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        tempDiv.querySelectorAll('input, textarea, select').forEach((input, idx) => {
            fields.push({
                type: input.type || input.tagName.toLowerCase(),
                name: input.name || `field_${idx}`,
                label: input.previousElementSibling?.textContent || `Champ ${idx + 1}`,
                placeholder: input.placeholder || '',
                required: input.required || false
            });
        });
        
        // Si aucun champ trouvé, créer un exemple
        if(fields.length === 0) {
            fields.push({
                type: 'text',
                name: 'nom',
                label: 'Nom',
                placeholder: 'Votre nom',
                required: true
            });
        }
        
        return fields;
    }

    f_vRenderFormEditor() {
        const list = document.getElementById('G_sFormFieldsList');
        let html = '';

        this.G_lFormFields.forEach((field, idx) => {
            html += `
                <div class="c-api-action">
                    <div class="c-api-action-header">
                        <span class="c-api-action-title">Champ ${idx + 1}: ${field.label}</span>
                        <button class="c-btn-small" onclick="G_cApp.f_vDeleteFormField(${idx})">Supprimer</button>
                    </div>
                    <div class="c-property">
                        <label>Type de champ</label>
                        <select id="field_${idx}_type" onchange="G_cApp.f_vUpdateFormField(${idx})">
                            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Texte</option>
                            <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
                            <option value="password" ${field.type === 'password' ? 'selected' : ''}>Mot de passe</option>
                            <option value="number" ${field.type === 'number' ? 'selected' : ''}>Nombre</option>
                            <option value="tel" ${field.type === 'tel' ? 'selected' : ''}>Téléphone</option>
                            <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Zone de texte</option>
                            <option value="select" ${field.type === 'select' ? 'selected' : ''}>Liste déroulante</option>
                            <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Case à cocher</option>
                            <option value="radio" ${field.type === 'radio' ? 'selected' : ''}>Bouton radio</option>
                        </select>
                    </div>
                    <div class="c-property">
                        <label>Nom (attribut name)</label>
                        <input type="text" id="field_${idx}_name" value="${field.name}" onchange="G_cApp.f_vUpdateFormField(${idx})">
                    </div>
                    <div class="c-property">
                        <label>Label affiché</label>
                        <input type="text" id="field_${idx}_label" value="${field.label}" onchange="G_cApp.f_vUpdateFormField(${idx})">
                    </div>
                    <div class="c-property">
                        <label>Placeholder</label>
                        <input type="text" id="field_${idx}_placeholder" value="${field.placeholder || ''}" onchange="G_cApp.f_vUpdateFormField(${idx})">
                    </div>
                    <div class="c-property">
                        <label>
                            <input type="checkbox" id="field_${idx}_required" ${field.required ? 'checked' : ''} onchange="G_cApp.f_vUpdateFormField(${idx})">
                            Champ obligatoire
                        </label>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;
    }

    f_vAddFormField() {
        this.G_lFormFields.push({
            type: 'text',
            name: `field_${this.G_lFormFields.length}`,
            label: `Champ ${this.G_lFormFields.length + 1}`,
            placeholder: '',
            required: false
        });
        this.f_vRenderFormEditor();
    }

    f_vDeleteFormField(p_iIdx) {
        this.G_lFormFields.splice(p_iIdx, 1);
        this.f_vRenderFormEditor();
    }

    f_vUpdateFormField(p_iIdx) {
        const field = this.G_lFormFields[p_iIdx];
        field.type = document.getElementById(`field_${p_iIdx}_type`).value;
        field.name = document.getElementById(`field_${p_iIdx}_name`).value;
        field.label = document.getElementById(`field_${p_iIdx}_label`).value;
        field.placeholder = document.getElementById(`field_${p_iIdx}_placeholder`).value;
        field.required = document.getElementById(`field_${p_iIdx}_required`).checked;
    }

    f_vApplyFormChanges() {
        // Générer le HTML à partir des champs
        let html = '';
        
        this.G_lFormFields.forEach(field => {
            html += '<div style="margin-bottom: 15px;">\n';
            html += `  <label>${field.label}${field.required ? ' *' : ''}</label>\n`;
            
            if(field.type === 'textarea') {
                html += `  <textarea name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}></textarea>\n`;
            } else if(field.type === 'select') {
                html += `  <select name="${field.name}" ${field.required ? 'required' : ''}>\n`;
                html += `    <option value="">Sélectionner...</option>\n`;
                html += `  </select>\n`;
            } else {
                html += `  <input type="${field.type}" name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>\n`;
            }
            
            html += '</div>\n';
        });
        
        html += '<button type="submit">Envoyer</button>';
        
        this.G_cSelectedElement.attributes.innerHTML = html;
        this.f_vRenderAll();
        this.f_vRenderProperties();
        this.f_vCloseFormEditor();
    }

    f_vCloseFormEditor() {
        document.getElementById('G_sFormEditorModal').style.display = 'none';
        this.G_lFormFields = null;
    }

    // ========== FIN ÉDITEUR DE FORMULAIRE ==========

    F_vExtractFromParent(p_cElement = null) {
        const element = p_cElement || this.G_cSelectedElement;
        if(!element || !element.parent) return;
        
        const parent = element.parent;
        
        // Retirer du parent
        parent.F_vRemoveChild(element);
        
        // Ajouter au niveau racine
        element.attributes.style.position = 'absolute';
        if(!element.attributes.style.left || element.attributes.style.left === '0px') {
            element.attributes.style.left = '50px';
        }
        if(!element.attributes.style.top || element.attributes.style.top === '0px') {
            element.attributes.style.top = '50px';
        }
        
        this.G_lElements.push(element);
        
        this.f_vRenderAll();
        this.f_vRenderTree();
        this.f_vRenderProperties();
    }

    F_vExportJSON() {
        // Debug : vérifier ce qui est dans G_cBodyElement
        console.log('Body Element avant export:', this.G_cBodyElement);
        
        // Sauvegarder les éléments de la page courante avant l'export
        if (this.G_cCurrentPage) {
            this.G_cCurrentPage.elements = this.G_lElements.map(e =>
                typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
            );
        }
        
        const l_cData = {
            version: '2.3', // Nouvelle version avec éléments par page
            body: {
                style: this.G_cBodyElement.attributes.style || {},
                className: this.G_cBodyElement.attributes.className || '',
                pseudoStyles: this.G_cBodyElement.pseudoStyles || {}
            },
            pages: this.G_lPages || [],
            currentPageId: this.G_cCurrentPage ? this.G_cCurrentPage.id : null,
            timestamp: new Date().toISOString()
        };
        
        console.log('Données à exporter:', l_cData);
        
        const l_sJSON = JSON.stringify(l_cData, null, 2);
        const l_cBlob = new Blob([l_sJSON], {type: 'application/json'});
        const l_sUrl = URL.createObjectURL(l_cBlob);
        const l_cA = document.createElement('a');
        l_cA.href = l_sUrl;
        l_cA.download = 'project.json';
        l_cA.click();
        URL.revokeObjectURL(l_sUrl);
    }

    F_vImportJSON() {
        document.getElementById('G_sFileInput').click();
    }

    F_vLoadProject(p_cData) {
        try {
            // Réinitialiser l'état du projet avant chargement
            this.G_lElements = [];
            this.G_cSelectedElement = null;
            this.G_lSelectedElements = [];
            this.G_cCurrentPage = null;
            this.G_sSelectedPageId = null;
            this.G_cPagePropertiesShown = null;
            this.G_lPages = [];
            this.G_iPageCounter = 0;
            this.G_lHistory = [];
            this.G_iHistoryIndex = -1;

            // Charger les styles du body s'ils existent
            if(p_cData.body) {
                this.G_cBodyElement.attributes.style = p_cData.body.style || {};
                this.G_cBodyElement.attributes.className = p_cData.body.className || '';
                this.G_cBodyElement.pseudoStyles = p_cData.body.pseudoStyles || {
                    hover: {},
                    active: {},
                    focus: {},
                    before: {},
                    after: {}
                };
            }
            
            // Charger les pages si elles existent (nouvelle structure v2.3+)
            if(p_cData.pages && p_cData.pages.length > 0) {
                this.G_lPages = p_cData.pages.map(page => {
                    // Convertir les éléments JSON en objets C_Element
                    if (page.elements && Array.isArray(page.elements)) {
                        page.elements = page.elements.map(e => C_Element.F_cFromJSON(e));
                    } else {
                        page.elements = [];
                    }
                    page.isMainPage = !!page.isMainPage;
                    page.meta = page.meta || { description: '', keywords: '' };
                    return page;
                });
                
                const l_iMaxCounter = this.G_lPages.reduce((max, p) => {
                    const match = p.id ? p.id.match(/page_(\d+)/) : null;
                    const value = match ? parseInt(match[1], 10) : 0;
                    return Math.max(max, isNaN(value) ? 0 : value);
                }, 0);
                this.G_iPageCounter = l_iMaxCounter;
                
                let l_sPageToLoadId = null;
                if(p_cData.currentPageId) {
                    const currentPage = this.G_lPages.find(p => p.id === p_cData.currentPageId);
                    if(currentPage) {
                        l_sPageToLoadId = currentPage.id;
                    }
                }
                if (!l_sPageToLoadId && this.G_lPages.length > 0) {
                    l_sPageToLoadId = this.G_lPages[0].id;
                }

                if (l_sPageToLoadId) {
                    this.f_vLoadPage(l_sPageToLoadId, null, true);
                } else {
                    this.G_cCurrentPage = null;
                    this.G_lElements = [];
                }
            } else if (p_cData.elements) {
                // Ancienne structure (v2.1-2.2) : éléments à la racine
                this.G_lElements = (p_cData.elements || []).map(e => C_Element.F_cFromJSON(e));
                
                // Créer une page par défaut si aucune n'existe
                this.f_vInitPages();
                if (this.G_cCurrentPage) {
                    this.G_cCurrentPage.elements = [...this.G_lElements];
                    this.f_vLoadPage(this.G_cCurrentPage.id, null, true);
                }
            } else {
                // Aucun élément ni page : initialiser par défaut
                this.G_lElements = [];
                this.f_vInitPages();
                if (this.G_cCurrentPage) {
                    this.f_vLoadPage(this.G_cCurrentPage.id, null, true);
                }
            }
            
            // Calculer le compteur max en parcourant TOUS les éléments de TOUTES les pages
            const f_iGetMaxId = (elements) => {
                let max = 0;
                elements.forEach(el => {
                    const match = el.id.match(/el-(\d+)/);
                    if(match) {
                        max = Math.max(max, parseInt(match[1]));
                    }
                    if(el.children && el.children.length > 0) {
                        max = Math.max(max, f_iGetMaxId(el.children));
                    }
                });
                return max;
            };
            
            // Chercher le max ID dans toutes les pages
            let maxId = 0;
            this.G_lPages.forEach(page => {
                if (page.elements && page.elements.length > 0) {
                    maxId = Math.max(maxId, f_iGetMaxId(page.elements));
                }
            });
            
            this.G_iCounter = maxId + 1;
            this.G_cSelectedElement = null;
            
            // Nettoyer toutes les propriétés undefined
            this.f_vCleanupAllStyles();
            
            this.f_vRenderAll();
            this.f_vRenderTree();
            this.f_vRenderProperties();
            this.f_vRenderPagesList();
        } catch(e) {
            this.f_vAlertError('Le projet n\'a pas pu être chargé correctement. Vérifiez le format du fichier.', 'Erreur de chargement');
            console.error(e);
        }
    }

    F_vExportZIP() {
        if (!this.G_lPages || this.G_lPages.length === 0) {
            this.f_vAlertError('Aucune page n\'est disponible pour l\'export. Créez ou importez une page avant de générer un ZIP.', 'Export impossible');
            return;
        }

        // Sauvegarder la page actuelle avant l'export (toujours en JSON)
        if (this.G_cCurrentPage) {
            this.G_cCurrentPage.elements = this.G_lElements.map(e =>
                typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
            );
        }
        
        const zip = new JSZip();
        
        // Fonction pour générer le HTML d'une page
        const f_sGeneratePageHTML = (page, isMainPage) => {
            const bodyClass = this.G_cBodyElement?.attributes?.className ? ` class="${this.G_cBodyElement.attributes.className}"` : '';
            const favicon = page.favicon || 'favicon.ico';

            // Calculer le chemin relatif vers les ressources selon la profondeur de la route
            const routeSegments = (page.route || '/').split('/').filter(p => p);
            const fileSegments = routeSegments.length > 0 ? routeSegments : ['home'];
            const assetDepth = isMainPage ? 0 : fileSegments.length + 1; // +1 pour le dossier "pages"
            const prefix = assetDepth === 0 ? './' : '../'.repeat(assetDepth);
            
            let l_sHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.title}</title>
<meta name="description" content="${page.meta.description || ''}">
<meta name="keywords" content="${page.meta.keywords || ''}">
<link rel="icon" href="${prefix}${favicon}">
<link rel="stylesheet" href="${prefix}style.css">
</head>
<body${bodyClass}>
<script>window.__PAGE_EXPORT_PREFIX = '${prefix}'; window.__PAGE_ID = '${page.id}';</script>
`;
            
            const f_vGenerateElement = (p_cEl) => {
                const l_sClass = p_cEl.attributes.className ? ` class="${p_cEl.attributes.className}"` : '';
                const l_sApiAttr = p_cEl.apiActions?.length ? ` data-api='${JSON.stringify(p_cEl.apiActions)}'` : '';
                
                // Générer data-nav en vérifiant à la fois navigationActions ET m_cNavigationLinks
                let l_bHasNav = false;
                let l_oNavData = {};
                
                // Vérifier navigationActions (ancien format)
                if (p_cEl.attributes.navigationActions && 
                    (p_cEl.attributes.navigationActions.onClick || 
                     p_cEl.attributes.navigationActions.onDoubleClick || 
                     p_cEl.attributes.navigationActions.onLoad)) {
                    l_bHasNav = true;
                    l_oNavData = p_cEl.attributes.navigationActions;
                }
                
                // Vérifier m_cNavigationLinks (nouveau format)
                if (p_cEl.m_cNavigationLinks && p_cEl.m_cNavigationLinks.length > 0) {
                    l_bHasNav = true;
                    // Convertir m_cNavigationLinks en navigationActions
                    const actionMap = {
                        'click': 'onClick',
                        'dblclick': 'onDoubleClick',
                        'load': 'onLoad'
                    };
                    p_cEl.m_cNavigationLinks.forEach(link => {
                        const actionKey = actionMap[link.action];
                        if (actionKey) {
                            l_oNavData[actionKey] = link.targetPage;
                        }
                    });
                }
                
                const l_sNavAttr = l_bHasNav ? ` data-nav='${JSON.stringify(l_oNavData)}'` : '';
                
                l_sHTML += `    <${p_cEl.type} id="${p_cEl.id}"${l_sClass}${l_sApiAttr}${l_sNavAttr}>${p_cEl.attributes.innerHTML || ''}`;
                p_cEl.children.forEach(c => f_vGenerateElement(c));
                l_sHTML += `</${p_cEl.type}>\n`;
            };
            
            (page.elements || []).forEach(e => f_vGenerateElement(e));
            l_sHTML += `    <script src="https://code.jquery.com/jquery-3.6.0.min.js"><\/script>
<script src="${prefix}framework.js"><\/script>
</body>
</html>`;
            return l_sHTML;
        };

        const f_sGenerateCSS = () => {
            let l_sCSS = 'body { margin: 0; padding: 0; font-family: Arial, sans-serif;';
            
            // Ajouter les styles personnalisés du body
            if(this.G_cBodyElement && this.G_cBodyElement.attributes.style) {
                for(let [key, value] of Object.entries(this.G_cBodyElement.attributes.style)) {
                    if(value === undefined || value === 'undefined' || value === '') continue;
                    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    l_sCSS += ` ${cssKey}: ${value};`;
                }
            }
            
            l_sCSS += ' }\n\n';
            
            // Ajouter les pseudo-classes du body
            if(this.G_cBodyElement && this.G_cBodyElement.pseudoStyles) {
                for(let [pseudo, styles] of Object.entries(this.G_cBodyElement.pseudoStyles)) {
                    if(Object.keys(styles).length > 0) {
                        const pseudoSelector = ['before', 'after'].includes(pseudo) ? `::${pseudo}` : `:${pseudo}`;
                        l_sCSS += `body${pseudoSelector} {\n`;
                        
                        for(let [key, value] of Object.entries(styles)) {
                            if(value === undefined || value === 'undefined' || value === '') continue;
                            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                            l_sCSS += `    ${cssKey}: ${value};\n`;
                        }
                        
                        l_sCSS += `}\n\n`;
                    }
                }
            }
            
            // Générer le CSS pour tous les éléments de toutes les pages
            const f_vGenerateElementCSS = (p_cEl) => {
                if(p_cEl.attributes.style && Object.keys(p_cEl.attributes.style).length > 0) {
                    l_sCSS += `#${p_cEl.id} {\n`;
                    
                    for(let [key, value] of Object.entries(p_cEl.attributes.style)) {
                        if(value === undefined || value === 'undefined' || value === '') continue;
                        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                        l_sCSS += `    ${cssKey}: ${value};\n`;
                    }
                    
                    l_sCSS += `}\n\n`;
                }

                if(p_cEl.pseudoStyles) {
                    for(let [pseudo, styles] of Object.entries(p_cEl.pseudoStyles)) {
                        if(Object.keys(styles).length > 0) {
                            const pseudoSelector = ['before', 'after'].includes(pseudo) ? `::${pseudo}` : `:${pseudo}`;
                            l_sCSS += `#${p_cEl.id}${pseudoSelector} {\n`;
                            
                            for(let [key, value] of Object.entries(styles)) {
                                if(value === undefined || value === 'undefined' || value === '') continue;
                                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                                l_sCSS += `    ${cssKey}: ${value};\n`;
                            }
                            
                            l_sCSS += `}\n\n`;
                        }
                    }
                }
                
                p_cEl.children.forEach(c => f_vGenerateElementCSS(c));
            };
            
            // Parcourir toutes les pages pour le CSS
            this.G_lPages.forEach(page => {
                (page.elements || []).forEach(e => f_vGenerateElementCSS(e));
            });
            
            return l_sCSS;
        };

        // Générer le CSS global
        const cssContent = f_sGenerateCSS();
        zip.file('style.css', cssContent);
        
        // Générer le framework JS
        zip.file('framework.js', this.f_sGenerateFramework());
        
        // Trouver la page principale
        const mainPage = this.G_lPages.find(p => p.isMainPage) || this.G_lPages[0];
        
        // Générer l'index.html (page principale)
        const indexHTML = f_sGeneratePageHTML(mainPage, true);
        zip.file('index.html', indexHTML);
        
        // Créer un dossier pages/
        const pagesFolder = zip.folder('pages');
        
        // Générer les autres pages dans le dossier pages/
        this.G_lPages.forEach(page => {
            if (page.id === mainPage.id) return; // Ignorer la page principale
            
            const pageHTML = f_sGeneratePageHTML(page, false);
            const pageJSON = {
                title: page.title,
                route: page.route,
                meta: page.meta,
                elements: (page.elements || []).map(e =>
                    typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
                )
            };
            
            // Créer le chemin du fichier basé sur la route
            // Ex: /contact -> contact/index.html
            // Ex: /article/laredoute -> article/laredoute/index.html
            let routePath = page.route.substring(1); // Retirer le / initial
            routePath = routePath.trim();
            if (!routePath) routePath = 'home';
            
            // Créer les sous-dossiers si nécessaire
            const pathParts = routePath.split('/')
                .map(part => part.trim())
                .filter(part => part.length > 0);
            let currentFolder = pagesFolder;
            
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                if (i === pathParts.length - 1) {
                    // Dernier élément : créer un dossier avec index.html dedans
                    const finalFolder = currentFolder.folder(part);
                    finalFolder.file('index.html', pageHTML);
                    finalFolder.file('page.json', JSON.stringify(pageJSON, null, 2));
                } else {
                    // Créer les dossiers intermédiaires
                    currentFolder = currentFolder.folder(part);
                }
            }
        });
        
        // Générer et télécharger le ZIP
        zip.generateAsync({type: 'blob'}).then(content => {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'export.zip';
            link.click();
            URL.revokeObjectURL(url);
            
            this.f_vShowToast('Export ZIP terminé !', 'success', 2000);
        });
    }

    f_sGenerateFramework() {
        // Ajouter le framework de navigation des pages
        const navigationFramework = this.f_sGetNavigationFramework ? this.f_sGetNavigationFramework() : '';
        
        return `
class C_APIFramework {
async F_cRequest(p_sUrl, p_cOptions = {}) {
try {
    const method = p_cOptions.method || 'GET';
    const headers = p_cOptions.headers || {};
    const fetchOptions = { method, headers };
    
    if (method !== 'GET' && method !== 'HEAD' && p_cOptions.body) {
        fetchOptions.body = JSON.stringify(p_cOptions.body);
    }
    
    const response = await fetch(p_sUrl, fetchOptions);
    return await response.json();
} catch(error) {
    G_cApp.f_vAlertError('Erreur lors de la requête API: ' + error.message, 'Erreur API');
    throw error;
}
}

F_vPopup(p_sMessage) {
G_cApp.f_vAlert(p_sMessage);
}

F_vInsertInDiv(p_sTargetId, p_sContent) {
const element = document.getElementById(p_sTargetId);
if(element) {
    const div = document.createElement('div');
    div.innerHTML = p_sContent;
    element.appendChild(div);
}
}

F_vReplaceContent(p_sTargetId, p_sContent) {
const element = document.getElementById(p_sTargetId);
if(element) element.innerHTML = p_sContent;
}
}

const G_cAPI = new C_APIFramework();

${navigationFramework}

document.addEventListener('DOMContentLoaded', () => {
// Gestion des actions API
document.querySelectorAll('[data-api]').forEach(el => {
const actions = JSON.parse(el.getAttribute('data-api'));

actions.forEach(action => {
    if(action.event === 'load') {
        G_cAPI.F_cRequest(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body
        }).then(data => {
            if(action.mode === 'backend') {
                // Mode backend : pas d'action sur l'affichage
                console.log('Backend action executed:', data);
            } else {
                // Mode frontend : affichage normal
                if(action.successAction === 'popup') {
                    G_cAPI.F_vPopup(JSON.stringify(data));
                } else if(action.successAction === 'insert') {
                    G_cAPI.F_vInsertInDiv(action.target, JSON.stringify(data));
                } else if(action.successAction === 'replace') {
                    G_cAPI.F_vReplaceContent(action.target, JSON.stringify(data));
                }
            }
        });
    } else {
        el.addEventListener(action.event, (e) => {
            // Empêcher l'action par défaut pour les formulaires
            if(el.tagName === 'FORM') {
                e.preventDefault();
            }
            
            G_cAPI.F_cRequest(action.url, {
                method: action.method,
                headers: action.headers,
                body: action.body
            }).then(data => {
                if(action.mode === 'backend') {
                    // Mode backend : pas d'action sur l'affichage
                    console.log('Backend action executed:', data);
                } else {
                    // Mode frontend : affichage normal
                    if(action.successAction === 'popup') {
                        G_cAPI.F_vPopup(JSON.stringify(data));
                    } else if(action.successAction === 'insert') {
                        G_cAPI.F_vInsertInDiv(action.target, JSON.stringify(data));
                    } else if(action.successAction === 'replace') {
                        G_cAPI.F_vReplaceContent(action.target, JSON.stringify(data));
                    }
                }
            });
        });
    }
});
});

// Gestion des actions de navigation
document.querySelectorAll('[data-nav]').forEach(el => {
    const navActions = JSON.parse(el.getAttribute('data-nav'));
    
    if(navActions.onClick) {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            F_vGoToPage(navActions.onClick);
        });
    }
    
    if(navActions.onDoubleClick) {
        el.addEventListener('dblclick', (e) => {
            e.preventDefault();
            F_vGoToPage(navActions.onDoubleClick);
        });
    }
    
    if(navActions.onLoad) {
    F_vGoToPage(navActions.onLoad);
    }
});
});
`;
    }

    F_vImportJSON() {
        document.getElementById('G_sFileInput').click();
    }

    F_vClear() {
        this.f_vConfirm(
            'Êtes-vous sûr de vouloir effacer tout le projet ? Cette action est irréversible.',
            () => {
                this.G_lElements = [];
                this.G_cSelectedElement = null;
                this.G_lSelectedElements = [];
                this.G_iCounter = 0;
                this.G_lHistory = [];
                this.G_iHistoryIndex = -1;
                this.f_vRenderAll();
                this.f_vSaveHistory();
                this.f_vAlertSuccess('Le projet a été effacé avec succès.', 'Projet effacé');
            },
            'Effacer le projet'
        );
    }

    f_vShowShortcuts() {
        document.getElementById('G_sShortcutsModal').style.display = 'block';
    }

    f_vCloseShortcuts() {
        document.getElementById('G_sShortcutsModal').style.display = 'none';
    }
}