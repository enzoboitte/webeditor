// Extension de C_App avec les nouvelles fonctionnalités

// ========== INITIALISATION ==========
// Charger les préférences sauvegardées au démarrage
window.addEventListener('DOMContentLoaded', function() {
    // Attendre que G_cApp soit initialisé
    setTimeout(function() {
        if (typeof G_cApp !== 'undefined') {
            const savedTheme = localStorage.getItem('editorTheme');
            const toggle = document.getElementById('G_sThemeToggle');
            
            if (savedTheme === 'light') {
                document.body.classList.add('theme-light');
                G_cApp.G_sEditorTheme = 'light';
                if (toggle) toggle.checked = false;
            } else {
                if (toggle) toggle.checked = true;
            }
        }
    }, 100);
});

C_App.prototype.f_vToggleResponsiveMode = function() {
    document.getElementById('G_sResponsiveModal').style.display = 'block';
};

C_App.prototype.f_vCloseResponsiveModal = function() {
    document.getElementById('G_sResponsiveModal').style.display = 'none';
};

C_App.prototype.f_vSetBreakpoint = function(type, width) {
    this.G_sCurrentBreakpoint = type;
    this.G_iResponsiveWidth = width;
    
    const workspace = document.getElementById('G_sWorkspace');
    const frame = document.getElementById('G_sResponsiveFrame');
    const btn = document.getElementById('G_sResponsiveModeBtn');
    
    if (width) {
        workspace.style.width = width + 'px';
        workspace.style.margin = '0 auto';
        frame.style.width = width + 'px';
        frame.style.height = '90%';
        frame.classList.add('c-responsive-active');
        
        const icons = {mobile: '📱', tablet: '📱', desktop: '🖥️'};
        btn.textContent = `${icons[type] || '📱'} ${type.charAt(0).toUpperCase() + type.slice(1)} (${width}px)`;
    } else {
        workspace.style.width = '';
        workspace.style.margin = '';
        frame.classList.remove('c-responsive-active');
        btn.textContent = '📱 Desktop';
    }
    
    this.f_vCloseResponsiveModal();
};

C_App.prototype.f_vSetCustomBreakpoint = function() {
    const width = parseInt(document.getElementById('G_sCustomWidth').value);
    if (width >= 320 && width <= 3840) {
        this.f_vSetBreakpoint('custom', width);
    }
};

// ========== GRID SYSTEM ==========
C_App.prototype.f_vToggleGrid = function() {
    this.G_bGridEnabled = !this.G_bGridEnabled;
    const overlay = document.getElementById('G_sGridOverlay');
    const toggle = document.getElementById('G_sGridToggle');
    
    if (toggle) {
        toggle.checked = this.G_bGridEnabled;
    }
    
    if (this.G_bGridEnabled) {
        overlay.classList.add('c-grid-active');
        this.f_vUpdateGridSize();
    } else {
        overlay.classList.remove('c-grid-active');
    }
};

C_App.prototype.f_vUpdateGridSize = function() {
    if (!this.G_bGridEnabled) return;
    
    const overlay = document.getElementById('G_sGridOverlay');
    if (!overlay) return;
    
    // Calculer la taille de grille en fonction du zoom
    // Taille de base : 20px à zoom 1.0
    let gridSize = 20;
    
    // Limiter la taille visible en fonction du zoom
    // Plus on zoom, plus la grille doit être grande en pixels pour rester visible
    const MIN_VISIBLE_SIZE = 15; // pixels minimum visibles
    const MAX_VISIBLE_SIZE = 50; // pixels maximum visibles
    
    // Taille visible = gridSize * zoom
    let visibleSize = gridSize * this.G_fZoom;
    
    // Ajuster la taille de base si nécessaire
    while (visibleSize < MIN_VISIBLE_SIZE) {
        gridSize *= 2;
        visibleSize = gridSize * this.G_fZoom;
    }
    
    while (visibleSize > MAX_VISIBLE_SIZE) {
        gridSize /= 2;
        visibleSize = gridSize * this.G_fZoom;
    }
    
    // Mettre à jour le background-size avec la nouvelle taille
    overlay.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    
    // Mettre à jour la taille de snap
    this.G_iGridSize = gridSize;
};

C_App.prototype.f_cSnapToGrid = function(value) {
    if (!this.G_bGridEnabled) return value;
    return Math.round(value / this.G_iGridSize) * this.G_iGridSize;
};

// ========== DESIGN TOKENS ==========
C_App.prototype.f_vOpenDesignTokens = function() {
    this.f_vSwitchRightTab('tokens');
};

C_App.prototype.f_vSwitchRightTab = function(tabName) {
    this.G_sActiveRightTab = tabName;
    
    // Mise à jour des onglets
    document.querySelectorAll('#G_sRightPanelTabs .c-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Mise à jour du contenu
    document.getElementById('G_sProperties').style.display = tabName === 'properties' ? 'block' : 'none';
    document.getElementById('G_sDesignTokensPanel').style.display = tabName === 'tokens' ? 'block' : 'none';
    document.getElementById('G_sCSSVariablesPanel').style.display = tabName === 'variables' ? 'block' : 'none';
    
    if (tabName === 'tokens') {
        this.f_vRenderDesignTokens();
    } else if (tabName === 'variables') {
        this.f_vRenderCSSVariables();
    }
};

C_App.prototype.f_vRenderDesignTokens = function() {
    const panel = document.getElementById('G_sDesignTokensPanel');
    
    if (!this.G_cDesignTokens.colors.length) {
        // Initialiser avec des tokens par défaut
        this.G_cDesignTokens = {
            colors: [
                {name: 'primary', value: '#0078d4'},
                {name: 'secondary', value: '#6c757d'},
                {name: 'success', value: '#28a745'},
                {name: 'danger', value: '#dc3545'},
                {name: 'warning', value: '#ffc107'},
                {name: 'info', value: '#17a2b8'}
            ],
            typography: [
                {name: 'font-base', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
                {name: 'font-heading', value: 'Georgia, serif'},
                {name: 'font-mono', value: 'Consolas, Monaco, monospace'}
            ],
            spacing: [
                {name: 'space-xs', value: '4px'},
                {name: 'space-sm', value: '8px'},
                {name: 'space-md', value: '16px'},
                {name: 'space-lg', value: '24px'},
                {name: 'space-xl', value: '32px'}
            ]
        };
    }
    
    let html = '<div style="padding: 16px;">';
    
    // Couleurs
    html += '<div class="c-token-category">';
    html += '<h3>🎨 Couleurs</h3>';
    this.G_cDesignTokens.colors.forEach((token, index) => {
        html += `
            <div class="c-token-item">
                <div class="c-token-preview" style="background: ${token.value};"></div>
                <div class="c-token-name">${token.name}</div>
                <div class="c-token-value">${token.value}</div>
                <div class="c-token-actions">
                    <button class="c-btn c-btn-secondary" onclick="G_cApp.f_vApplyToken('color', ${index})">Appliquer</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    // Typographie
    html += '<div class="c-token-category">';
    html += '<h3>📝 Typographie</h3>';
    this.G_cDesignTokens.typography.forEach((token, index) => {
        html += `
            <div class="c-token-item">
                <div class="c-token-name">${token.name}</div>
                <div class="c-token-value" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${token.value}</div>
                <div class="c-token-actions">
                    <button class="c-btn c-btn-secondary" onclick="G_cApp.f_vApplyToken('font-family', ${index})">Appliquer</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    // Espacement
    html += '<div class="c-token-category">';
    html += '<h3>📏 Espacement</h3>';
    this.G_cDesignTokens.spacing.forEach((token, index) => {
        html += `
            <div class="c-token-item">
                <div class="c-token-name">${token.name}</div>
                <div class="c-token-value">${token.value}</div>
                <div class="c-token-actions">
                    <button class="c-btn c-btn-secondary" onclick="G_cApp.f_vApplyToken('padding', ${index})">Padding</button>
                    <button class="c-btn c-btn-secondary" onclick="G_cApp.f_vApplyToken('margin', ${index})">Margin</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    html += '</div>';
    panel.innerHTML = html;
};

C_App.prototype.f_vApplyToken = function(property, index) {
    if (!this.G_cSelectedElement) {
        this.f_vAlertWarning('Veuillez sélectionner un élément avant d\'appliquer un token.', 'Aucun élément sélectionné');
        return;
    }
    
    let value;
    if (property === 'color' || property === 'background-color') {
        value = this.G_cDesignTokens.colors[index]?.value;
    } else if (property === 'font-family') {
        value = this.G_cDesignTokens.typography[index]?.value;
    } else if (property === 'padding' || property === 'margin') {
        value = this.G_cDesignTokens.spacing[index]?.value;
    }
    
    if (value) {
        this.G_cSelectedElement.attributes.style[property] = value;
        this.f_vRenderAll();
        this.f_vSaveHistory();
        this.f_vShowToast(`Token appliqué: ${property}`, 'success', 2000);
    }
};

// ========== CSS VARIABLES ==========
C_App.prototype.f_vRenderCSSVariables = function() {
    const panel = document.getElementById('G_sCSSVariablesPanel');
    
    if (Object.keys(this.G_cCSSVariables).length === 0) {
        // Initialiser avec des variables par défaut
        this.G_cCSSVariables = {
            '--primary-color': '#0078d4',
            '--text-color': '#333333',
            '--bg-color': '#ffffff',
            '--border-radius': '4px',
            '--box-shadow': '0 2px 4px rgba(0,0,0,0.1)'
        };
    }
    
    let html = '<div style="padding: 16px;">';
    html += '<button class="c-btn c-btn-add" onclick="G_cApp.f_vAddCSSVariable()" style="margin-bottom: 16px;">+ Ajouter une variable</button>';
    
    Object.entries(this.G_cCSSVariables).forEach(([name, value]) => {
        html += `
            <div class="c-variable-item">
                <div class="c-variable-name">${name}</div>
                <div class="c-variable-value">${value}</div>
                <div class="c-token-actions">
                    <button class="c-btn c-btn-secondary" onclick="G_cApp.f_vEditCSSVariable('${name}')">✏️</button>
                    <button class="c-btn c-btn-danger" onclick="G_cApp.f_vDeleteCSSVariable('${name}')">🗑️</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    panel.innerHTML = html;
    
    // Appliquer les variables au document
    this.f_vApplyCSSVariables();
};

C_App.prototype.f_vApplyCSSVariables = function() {
    const root = document.documentElement;
    Object.entries(this.G_cCSSVariables).forEach(([name, value]) => {
        root.style.setProperty(name, value);
    });
};

C_App.prototype.f_vAddCSSVariable = function() {
    this.f_vPrompt(
        'Entrez le nom de la variable CSS (doit commencer par --):', 
        (name) => {
            if (name.startsWith('--')) {
                this.f_vPrompt(
                    'Entrez la valeur de la variable:',
                    (value) => {
                        this.G_cCSSVariables[name] = value;
                        this.f_vRenderCSSVariables();
                        this.f_vShowToast('Variable CSS ajoutée', 'success', 2000);
                    },
                    '',
                    'Valeur de la variable',
                    'Ex: #0078d4, 16px, etc.'
                );
            } else {
                this.f_vAlertError('Le nom doit commencer par --', 'Format invalide');
            }
        },
        '',
        'Nouvelle variable CSS',
        'Ex: --ma-couleur'
    );
};

C_App.prototype.f_vEditCSSVariable = function(name) {
    this.f_vPrompt(
        `Nouvelle valeur pour ${name}:`,
        (value) => {
            this.G_cCSSVariables[name] = value;
            this.f_vRenderCSSVariables();
            this.f_vShowToast('Variable CSS modifiée', 'success', 2000);
        },
        this.G_cCSSVariables[name],
        'Modifier la variable',
        ''
    );
};

C_App.prototype.f_vDeleteCSSVariable = function(name) {
    this.f_vConfirm(
        `Êtes-vous sûr de vouloir supprimer la variable ${name} ?`,
        () => {
            delete this.G_cCSSVariables[name];
            this.f_vRenderCSSVariables();
            this.f_vShowToast('Variable CSS supprimée', 'info', 2000);
        },
        'Supprimer la variable'
    );
};

// ========== THEME TOGGLE ==========
C_App.prototype.f_vToggleEditorTheme = function() {
    this.G_sEditorTheme = this.G_sEditorTheme === 'dark' ? 'light' : 'dark';
    const toggle = document.getElementById('G_sThemeToggle');
    
    if (toggle) {
        toggle.checked = this.G_sEditorTheme === 'dark';
    }
    
    if (this.G_sEditorTheme === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }
    
    // Sauvegarder la préférence
    localStorage.setItem('editorTheme', this.G_sEditorTheme);
};
