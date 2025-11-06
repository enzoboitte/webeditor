<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Éditeur Web</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
            background: #1e1e1e;
            color: #fff;
        }
        #G_sTopBar {
            height: 50px;
            background: #2d2d2d;
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 10px;
            border-bottom: 1px solid #404040;
        }
        .c-btn {
            padding: 8px 16px;
            background: #0078d4;
            border: none;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            font-size: 13px;
        }
        .c-btn:hover {
            background: #006cbd;
        }
        #G_sContainer {
            display: flex;
            height: calc(100vh - 50px);
        }
        #G_sLeftPanel {
            width: 280px;
            background: #252525;
            border-right: 1px solid #404040;
            display: flex;
            flex-direction: column;
        }
        #G_sLeftPanelTabs {
            display: flex;
            background: #1e1e1e;
            border-bottom: 1px solid #404040;
        }
        .c-tab {
            flex: 1;
            padding: 12px;
            background: #252525;
            border: none;
            color: #999;
            cursor: pointer;
            font-size: 13px;
            border-bottom: 2px solid transparent;
        }
        .c-tab.active {
            color: #fff;
            border-bottom-color: #0078d4;
            background: #2d2d2d;
        }
        .c-tab:hover {
            background: #2d2d2d;
        }
        #G_sComponentLibrary {
            padding: 15px;
            flex: 1;
            overflow-y: auto;
            display: none;
        }
        #G_sComponentLibrary.active {
            display: block;
        }
        .c-component-item {
            padding: 10px;
            margin: 5px 0;
            background: #333;
            border-radius: 4px;
            cursor: move;
            font-size: 13px;
        }
        .c-component-item:hover {
            background: #404040;
        }
        #G_sTreeView {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            display: none;
        }
        #G_sTreeView.active {
            display: block;
        }
        .c-tree-item {
            padding: 10px 12px;
            margin: 2px 0;
            background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
            border-radius: 6px;
            cursor: move;
            user-select: none;
            position: relative;
            padding-left: 30px;
            border: 2px solid transparent;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .c-tree-item:hover {
            background: linear-gradient(135deg, #404040 0%, #353535 100%);
            border-color: #555;
            transform: translateX(3px);
        }
        .c-tree-item.selected {
            background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
            border-color: #0078d4;
            box-shadow: 0 2px 8px rgba(0, 120, 212, 0.4);
        }
        .c-tree-item.c-drag-over {
            border-color: #28a745;
            background: linear-gradient(135deg, #1a4d2e 0%, #0f3a1f 100%);
        }
        .c-tree-item-content {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .c-tree-item-type {
            font-size: 11px;
            background: rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 3px;
            color: #aaa;
        }
        .c-tree-children {
            margin-left: 25px;
            border-left: 2px solid #404040;
            padding-left: 5px;
        }
        .c-tree-toggle {
            position: absolute;
            left: 8px;
            top: 8px;
            cursor: pointer;
        }
        #G_sCanvas {
            flex: 1;
            background: #1a1a1a;
            position: relative;
            overflow: auto;
        }
        #G_sWorkspace {
            min-width: 100%;
            min-height: 100%;
            position: relative;
        }
        .c-element {
            position: absolute;
            border: 2px dashed transparent;
            cursor: move;
            user-select: none;
        }
        .c-element:hover {
            border-color: #0078d4;
        }
        .c-element.selected {
            border-color: #00ff00;
            border-style: solid;
        }
        .c-element.multi-selected {
            border-color: #ffaa00;
            border-style: dashed;
        }
        .c-element.c-dragging {
            opacity: 0.5;
        }
        .c-resize-handle {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #00ff00;
            border: 1px solid #fff;
            z-index: 1000;
        }
        .c-resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
        .c-resize-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
        .c-resize-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
        .c-resize-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }
        #G_sRightPanel {
            width: 320px;
            background: #252525;
            border-left: 1px solid #404040;
            overflow-y: auto;
            padding: 15px;
        }
        .c-property-group {
            margin-bottom: 20px;
        }
        .c-property-group h3 {
            font-size: 13px;
            margin-bottom: 10px;
            color: #aaa;
        }
        .c-property {
            margin-bottom: 10px;
        }
        .c-property label {
            display: block;
            font-size: 12px;
            margin-bottom: 5px;
            color: #999;
        }
        .c-property input, .c-property select, .c-property textarea {
            width: 100%;
            padding: 8px;
            background: #1e1e1e;
            border: 1px solid #404040;
            border-radius: 4px;
            color: #fff;
            font-size: 13px;
        }
        .c-property textarea {
            min-height: 80px;
            font-family: monospace;
            resize: vertical;
        }
        #l_sFullCSS {
            min-height: 200px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .c-pseudo-tab {
            padding: 6px 12px;
            background: #333;
            border: 1px solid #555;
            color: #fff;
            cursor: pointer;
            border-radius: 4px;
            font-size: 11px;
            transition: all 0.2s;
        }
        .c-pseudo-tab:hover {
            background: #404040;
        }
        .c-pseudo-tab.active {
            background: #0078d4;
            border-color: #0078d4;
        }
        .c-api-action {
            background: #1e1e1e;
            border: 1px solid #404040;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .c-api-action-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .c-api-action-title {
            font-weight: bold;
            color: #0078d4;
        }
        .c-btn-small {
            padding: 4px 8px;
            font-size: 11px;
            background: #d13438;
            border: none;
            color: #fff;
            cursor: pointer;
            border-radius: 3px;
        }
        .c-btn-small:hover {
            background: #b02a2e;
        }
        .c-css-property-item input {
            background: #1e1e1e;
            border: 1px solid #404040;
            color: #fff;
            border-radius: 3px;
        }
        .c-css-property-item input:focus {
            outline: none;
            border-color: #0078d4;
        }
        .c-btn-add {
            background: #28a745;
            width: 100%;
            margin-top: 10px;
        }
        .c-drag-over {
            background: #404040 !important;
        }
        .c-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
        }
        .c-modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2d2d2d;
            padding: 30px;
            border-radius: 8px;
            min-width: 500px;
        }
        .c-modal-content h2 {
            margin-bottom: 20px;
        }
        .c-close {
            position: absolute;
            right: 15px;
            top: 15px;
            cursor: pointer;
            font-size: 24px;
        }
    </style>
</head>
<body>
    <div id="G_sTopBar">
        <button class="c-btn" onclick="G_cApp.F_vExportJSON()">Export JSON</button>
        <button class="c-btn" onclick="G_cApp.F_vImportJSON()">Import JSON</button>
        <button class="c-btn" onclick="G_cApp.F_vExportZIP()">Export ZIP</button>
        <button class="c-btn" onclick="G_cApp.F_vClear()">Clear</button>
        <button class="c-btn" onclick="G_cApp.f_vShowShortcuts()" style="background: #6c757d;">⌨️ Raccourcis</button>
        <input type="file" id="G_sFileInput" accept=".json" style="display:none">
    </div>
    
    <div id="G_sContainer">
        <div id="G_sLeftPanel">
            <div id="G_sLeftPanelTabs">
                <button class="c-tab active" onclick="G_cApp.F_vSwitchTab('components')">Composants</button>
                <button class="c-tab" onclick="G_cApp.F_vSwitchTab('tree')">Arborescence</button>
            </div>
            <div id="G_sComponentLibrary" class="active">
                <h3 style="margin-bottom: 15px;">Chargement...</h3>
            </div>
            <div id="G_sTreeView"></div>
        </div>
        
        <div id="G_sCanvas">
            <div id="G_sWorkspace"></div>
        </div>
        
        <div id="G_sRightPanel">
            <div id="G_sProperties"></div>
        </div>
    </div>

    <div id="G_sAPIModal" class="c-modal">
        <div class="c-modal-content">
            <span class="c-close" onclick="G_cApp.F_vCloseAPIModal()">&times;</span>
            <h2>Gestion des Actions API</h2>
            <div id="G_sAPIActionsList"></div>
            <button class="c-btn c-btn-add" onclick="G_cApp.F_vAddAPIAction()">+ Ajouter une action</button>
        </div>
    </div>

    <div id="G_sFormEditorModal" class="c-modal">
        <div class="c-modal-content">
            <span class="c-close" onclick="G_cApp.f_vCloseFormEditor()">&times;</span>
            <h2>Éditeur de Formulaire</h2>
            <div id="G_sFormFieldsList"></div>
            <button class="c-btn c-btn-add" onclick="G_cApp.f_vAddFormField()">+ Ajouter un champ</button>
            <div style="margin-top: 20px; text-align: right;">
                <button class="c-btn" onclick="G_cApp.f_vApplyFormChanges()">Appliquer</button>
            </div>
        </div>
    </div>

    <div id="G_sShortcutsModal" class="c-modal">
        <div class="c-modal-content" style="max-width: 600px;">
            <span class="c-close" onclick="G_cApp.f_vCloseShortcuts()">&times;</span>
            <h2>⌨️ Raccourcis Clavier</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                    <h3 style="color: #0078d4; margin-bottom: 10px;">Ajouter des composants</h3>
                    <div style="font-size: 13px; line-height: 1.8;">
                        <div><kbd>Ctrl+Shift+D</kbd> → DIV</div>
                        <div><kbd>Ctrl+Shift+B</kbd> → Button</div>
                        <div><kbd>Ctrl+Shift+I</kbd> → Input</div>
                        <div><kbd>Ctrl+Shift+T</kbd> → Textarea</div>
                        <div><kbd>Ctrl+Shift+P</kbd> → Paragraph</div>
                        <div><kbd>Ctrl+Shift+H</kbd> → Heading</div>
                        <div><kbd>Ctrl+Shift+F</kbd> → Form</div>
                        <div><kbd>Ctrl+Shift+A</kbd> → Link</div>
                        <div><kbd>Ctrl+Shift+L</kbd> → Liste UL</div>
                    </div>
                </div>
                <div>
                    <h3 style="color: #0078d4; margin-bottom: 10px;">Actions</h3>
                    <div style="font-size: 13px; line-height: 1.8;">
                        <div><kbd>Delete</kbd> → Supprimer</div>
                        <div><kbd>Ctrl+D</kbd> → Dupliquer</div>
                        <div><kbd>Ctrl+A</kbd> → Tout sélectionner</div>
                        <div><kbd>Ctrl+C</kbd> → Copier</div>
                        <div><kbd>Ctrl+V</kbd> → Coller</div>
                        <div><kbd>Ctrl+Click</kbd> → Multi-sélection</div>
                        <div><kbd>←→↑↓</kbd> → Déplacer (1px)</div>
                        <div><kbd>Shift+←→↑↓</kbd> → Déplacer (10px)</div>
                    </div>
                </div>
            </div>
            <style>
                kbd {
                    background: #1e1e1e;
                    border: 1px solid #555;
                    border-radius: 3px;
                    padding: 2px 6px;
                    font-family: monospace;
                    font-size: 11px;
                    color: #0078d4;
                }
            </style>
        </div>
    </div>

    <script>
        class C_APIFramework {
            async F_cRequest(p_sUrl, p_cOptions = {}) {
                try {
                    const method = p_cOptions.method || 'GET';
                    const fetchOptions = {
                        method: method,
                        headers: p_cOptions.headers || {}
                    };
                    
                    // Ne pas inclure body pour GET et HEAD
                    if (method !== 'GET' && method !== 'HEAD' && p_cOptions.body) {
                        fetchOptions.body = JSON.stringify(p_cOptions.body);
                    }
                    
                    const l_cResponse = await fetch(p_sUrl, fetchOptions);
                    return await l_cResponse.json();
                } catch(l_cError) {
                    console.error('API Error:', l_cError);
                    throw l_cError;
                }
            }

            F_vPopup(p_sMessage) {
                alert(p_sMessage);
            }

            F_vInsertInDiv(p_sTargetId, p_sContent) {
                const l_cElement = document.getElementById(p_sTargetId);
                if(l_cElement) {
                    const l_cDiv = document.createElement('div');
                    l_cDiv.innerHTML = p_sContent;
                    l_cElement.appendChild(l_cDiv);
                }
            }

            F_vReplaceContent(p_sTargetId, p_sContent) {
                const l_cElement = document.getElementById(p_sTargetId);
                if(l_cElement) l_cElement.innerHTML = p_sContent;
            }
        }

        // Templates UI par défaut (fallback si fichiers JSON non chargés)
        const G_UI_TEMPLATES = {
            card: {
                style: { background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', width: '300px', height: 'auto' },
                innerHTML: '<h3 style="margin-bottom:10px">Card Title</h3><p>Card content goes here...</p>'
            },
            navbar: {
                style: { background: '#2d2d2d', color: '#fff', padding: '15px 20px', width: '100%', height: '60px', display: 'flex', alignItems: 'center', gap: '20px' },
                innerHTML: '<div>Logo</div><div>Menu</div><div>Search</div>'
            },
            modal: {
                style: { background: '#fff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', padding: '30px', width: '400px', height: 'auto' },
                innerHTML: '<h2>Modal Title</h2><p>Modal content...</p><button>Close</button>'
            },
            alert: {
                style: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '4px', padding: '15px', width: '100%', height: 'auto' },
                innerHTML: '⚠️ This is an alert message'
            },
            grid: {
                style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%', height: 'auto', padding: '20px' },
                innerHTML: '<div style="background:#ddd;padding:20px">1</div><div style="background:#ddd;padding:20px">2</div><div style="background:#ddd;padding:20px">3</div>'
            },
            sidebar: {
                style: { background: '#252525', color: '#fff', width: '250px', height: '100vh', padding: '20px' },
                innerHTML: '<h3>Sidebar</h3><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>'
            },
            footer: {
                style: { background: '#2d2d2d', color: '#fff', padding: '20px', width: '100%', height: 'auto', textAlign: 'center' },
                innerHTML: '<p>&copy; 2025 My Website. All rights reserved.</p>'
            }
        };

        class C_Element {
            constructor(p_sType, p_sId, p_cTemplate = null) {
                this.id = p_sId;
                this.type = p_sType;
                this.children = [];
                this.parent = null;
                this.template = p_cTemplate;
                this.parameters = {};
                
                // Si template fourni, l'utiliser
                if(p_cTemplate) {
                    this.parameters = {};
                    for(let key in p_cTemplate.parameters) {
                        this.parameters[key] = p_cTemplate.parameters[key].default;
                    }
                    this.attributes = {
                        style: {...this.f_cProcessMacros(p_cTemplate.css)},
                        className: '',
                        innerHTML: this.f_sProcessHTML(p_cTemplate.html)
                    };
                } else if(G_UI_TEMPLATES[p_sType]) {
                    this.attributes = {
                        style: {...G_UI_TEMPLATES[p_sType].style},
                        className: '',
                        innerHTML: G_UI_TEMPLATES[p_sType].innerHTML
                    };
                } else {
                    this.attributes = {
                        style: {
                            position: 'absolute',
                            left: '50px',
                            top: '50px',
                            width: '200px',
                            height: '100px',
                            background: '#333',
                            color: '#fff',
                            padding: '10px'
                        },
                        className: '',
                        innerHTML: p_sType.toUpperCase()
                    };
                }
                
                this.apiActions = []; // Plusieurs actions API
            }

            f_sProcessHTML(p_sHTML) {
                let result = p_sHTML;
                // Remplacer {{PARAM}}
                result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                    if(key === 'CLASS') return this.attributes?.className || '';
                    if(key === 'ID') return this.id;
                    return this.parameters[key] || '';
                });
                return result;
            }

            f_cProcessMacros(p_cCSS) {
                const result = {};
                for(let key in p_cCSS) {
                    let value = p_cCSS[key];
                    // Chercher {{MACRO}}
                    const macroMatch = value.match(/\{\{(\w+)\}\}/);
                    if(macroMatch && this.template?.macros) {
                        const macroName = macroMatch[1];
                        const macroData = this.template.macros[macroName];
                        if(macroData) {
                            let paramValue = this.parameters[macroName.toLowerCase()] || 
                                             Object.keys(macroData)[0];
                            // Convertir boolean en string pour les macros
                            paramValue = String(paramValue);
                            value = macroData[paramValue] || value;
                        }
                    }
                    // Remplacer {{param}}
                    value = value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
                        return this.parameters[paramKey] || match;
                    });
                    result[key] = value;
                }
                return result;
            }

            F_vAddChild(p_cChild) {
                this.children.push(p_cChild);
                p_cChild.parent = this;
            }

            F_vRemoveChild(p_cChild) {
                this.children = this.children.filter(c => c.id !== p_cChild.id);
                p_cChild.parent = null;
            }

            F_cToJSON() {
                return {
                    id: this.id,
                    type: this.type,
                    attributes: this.attributes,
                    parameters: this.parameters,
                    apiActions: this.apiActions,
                    children: this.children.map(c => c.F_cToJSON())
                };
            }

            static F_cFromJSON(p_cData) {
                const l_cElement = new C_Element(p_cData.type, p_cData.id);
                l_cElement.attributes = p_cData.attributes;
                l_cElement.parameters = p_cData.parameters || {};
                l_cElement.apiActions = p_cData.apiActions || [];
                l_cElement.children = (p_cData.children || []).map(c => C_Element.F_cFromJSON(c));
                l_cElement.children.forEach(c => c.parent = l_cElement);
                return l_cElement;
            }
        }

        class C_App {
            constructor() {
                this.G_lElements = [];
                this.G_cSelectedElement = null;
                this.G_lSelectedElements = []; // Multi-sélection
                this.G_lClipboard = []; // Presse-papiers pour copier/coller
                this.G_iCounter = 0;
                this.G_cDraggedComponent = null;
                this.G_cDraggedTemplate = null;
                this.G_cDraggedElement = null;
                this.G_cDraggedTreeElement = null;
                this.G_cAPI = new C_APIFramework();
                this.G_bIsDragging = false;
                this.G_bIsResizing = false;
                this.G_cDragOffset = {x: 0, y: 0};
                this.G_lComponentTemplates = [];
                this.G_sActiveTab = 'components';
                this.f_vInit();
            }

            async f_vInit() {
                await this.f_vLoadComponentTemplates();
                this.f_vRenderComponentLibrary();
                this.f_vSetupDragDrop();
                this.f_vSetupCanvas();
                this.f_vSetupFileInput();
                this.f_vSetupKeyboardShortcuts();
            }

            f_vSetupKeyboardShortcuts() {
                document.addEventListener('keydown', (e) => {
                    // Ignorer si on est dans un input/textarea
                    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                    
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
                    
                    // Flèches pour déplacer l'élément sélectionné
                    if(this.G_cSelectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault();
                        const step = e.shiftKey ? 10 : 1;
                        const currentLeft = parseInt(this.G_cSelectedElement.attributes.style.left) || 0;
                        const currentTop = parseInt(this.G_cSelectedElement.attributes.style.top) || 0;
                        
                        switch(e.key) {
                            case 'ArrowLeft':
                                this.G_cSelectedElement.attributes.style.left = (currentLeft - step) + 'px';
                                break;
                            case 'ArrowRight':
                                this.G_cSelectedElement.attributes.style.left = (currentLeft + step) + 'px';
                                break;
                            case 'ArrowUp':
                                this.G_cSelectedElement.attributes.style.top = (currentTop - step) + 'px';
                                break;
                            case 'ArrowDown':
                                this.G_cSelectedElement.attributes.style.top = (currentTop + step) + 'px';
                                break;
                        }
                        
                        this.f_vRenderAll();
                        this.f_vUpdateCSSEditor();
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
                this.f_vRenderAll();
                this.F_vSelectElement(l_cElement);
            }

            f_vDuplicateElement() {
                if(!this.G_cSelectedElement) return;
                
                const l_sId = 'el-' + this.G_iCounter++;
                const jsonData = this.G_cSelectedElement.F_cToJSON();
                jsonData.id = l_sId;
                
                const l_cNewElement = C_Element.F_cFromJSON(jsonData);
                
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
                
                this.f_vRenderAll();
                this.F_vSelectElement(l_cNewElement);
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
                
                // Coller et décaler chaque élément
                this.G_lClipboard.forEach((jsonData, index) => {
                    const l_sId = 'el-' + this.G_iCounter++;
                    const clonedData = JSON.parse(JSON.stringify(jsonData));
                    clonedData.id = l_sId;
                    
                    const l_cNewElement = C_Element.F_cFromJSON(clonedData);
                    
                    // Décaler de 20px pour chaque élément collé
                    const currentLeft = parseInt(l_cNewElement.attributes.style.left) || 0;
                    const currentTop = parseInt(l_cNewElement.attributes.style.top) || 0;
                    l_cNewElement.attributes.style.left = (currentLeft + 20 + (index * 10)) + 'px';
                    l_cNewElement.attributes.style.top = (currentTop + 20 + (index * 10)) + 'px';
                    
                    this.G_lElements.push(l_cNewElement);
                    this.G_lSelectedElements.push(l_cNewElement);
                });
                
                this.f_vRenderAll();
                
                // Appliquer le style multi-sélection aux nouveaux éléments
                this.G_lSelectedElements.forEach(element => {
                    const domElement = document.getElementById(element.id);
                    if(domElement) {
                        domElement.classList.add('multi-selected');
                    }
                });
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
                
                let html = '<h3 style="margin-bottom: 15px;">Composants HTML</h3>';
                const htmlComponents = [
                    {type: 'div', icon: '📦', name: 'DIV Container'},
                    {type: 'input', icon: '📝', name: 'Input'},
                    {type: 'textarea', icon: '📄', name: 'Textarea'},
                    {type: 'select', icon: '📋', name: 'Select'},
                    {type: 'p', icon: '📰', name: 'Paragraph'},
                    {type: 'h1', icon: '🔤', name: 'Heading 1'},
                    {type: 'h2', icon: '🔤', name: 'Heading 2'},
                    {type: 'h3', icon: '🔤', name: 'Heading 3'},
                    {type: 'img', icon: '🖼️', name: 'Image'},
                    {type: 'form', icon: '📋', name: 'Form'},
                    {type: 'ul', icon: '📑', name: 'Liste UL'},
                    {type: 'table', icon: '📊', name: 'Table'},
                    {type: 'a', icon: '🔗', name: 'Link'}
                ];

                htmlComponents.forEach(comp => {
                    html += `<div class="c-component-item" draggable="true" data-type="${comp.type}">${comp.icon} ${comp.name}</div>`;
                });

                html += '<h3 style="margin: 15px 0;">Composants UI</h3>';
                
                // Templates chargés depuis JSON
                this.G_lComponentTemplates.forEach((template, idx) => {
                    html += `<div class="c-component-item" draggable="true" data-template="${idx}">${template.icon} ${template.name}</div>`;
                });

                // Composants UI par défaut
                const uiComponents = [
                    {type: 'alert', icon: '⚠️', name: 'Alert'},
                    {type: 'grid', icon: '📐', name: 'Grid'},
                    {type: 'sidebar', icon: '📑', name: 'Sidebar'},
                    {type: 'footer', icon: '📌', name: 'Footer'}
                ];

                uiComponents.forEach(comp => {
                    html += `<div class="c-component-item" draggable="true" data-type="${comp.type}">${comp.icon} ${comp.name}</div>`;
                });

                library.innerHTML = html;
            }

            F_vSwitchTab(p_sTab) {
                this.G_sActiveTab = p_sTab;
                
                document.querySelectorAll('.c-tab').forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
                
                document.getElementById('G_sComponentLibrary').classList.toggle('active', p_sTab === 'components');
                document.getElementById('G_sTreeView').classList.toggle('active', p_sTab === 'tree');
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
                                alert('Erreur lors du chargement du fichier JSON');
                            }
                        };
                        l_cReader.readAsText(l_cFile);
                    }
                });
            }

            f_vSetupDragDrop() {
                document.addEventListener('dragstart', (l_cE) => {
                    if(l_cE.target.classList.contains('c-component-item')) {
                        const templateIdx = l_cE.target.dataset.template;
                        if(templateIdx !== undefined) {
                            this.G_cDraggedTemplate = this.G_lComponentTemplates[parseInt(templateIdx)];
                            this.G_cDraggedComponent = null;
                        } else {
                            this.G_cDraggedComponent = l_cE.target.dataset.type;
                            this.G_cDraggedTemplate = null;
                        }
                    }
                });
            }

            f_vSetupCanvas() {
                const l_cWorkspace = document.getElementById('G_sWorkspace');
                
                l_cWorkspace.addEventListener('dragover', (l_cE) => {
                    // Accepter le drop sur le workspace ou ses enfants directs (éléments de niveau racine)
                    if(this.G_cDraggedComponent || this.G_cDraggedTemplate) {
                        l_cE.preventDefault();
                    }
                });

                l_cWorkspace.addEventListener('drop', (l_cE) => {
                    // Drop sur le workspace principal (pas dans un conteneur)
                    if(this.G_cDraggedComponent || this.G_cDraggedTemplate) {
                        // Vérifier si on a droppé sur le workspace lui-même ou sur un élément de niveau racine
                        const isWorkspace = l_cE.target.id === 'G_sWorkspace';
                        const isRootElement = l_cE.target.classList.contains('c-element') && 
                                            this.G_lElements.some(el => el.id === l_cE.target.id);
                        
                        if(isWorkspace || isRootElement) {
                            l_cE.preventDefault();
                            l_cE.stopPropagation();
                            
                            const l_cRect = l_cWorkspace.getBoundingClientRect();
                            const l_sId = 'el-' + this.G_iCounter++;
                            
                            let l_cElement;
                            if(this.G_cDraggedTemplate) {
                                // Remplacer espaces par tirets pour un type valide
                                const l_sType = this.G_cDraggedTemplate.name.toLowerCase().replace(/\s+/g, '-');
                                l_cElement = new C_Element(l_sType, l_sId, this.G_cDraggedTemplate);
                            } else {
                                l_cElement = new C_Element(this.G_cDraggedComponent, l_sId);
                            }
                            
                            l_cElement.attributes.style.left = (l_cE.clientX - l_cRect.left) + 'px';
                            l_cElement.attributes.style.top = (l_cE.clientY - l_cRect.top) + 'px';
                            l_cElement.attributes.style.position = 'absolute';
                            
                            this.G_lElements.push(l_cElement);
                            this.f_vRenderAll();
                            this.G_cDraggedComponent = null;
                            this.G_cDraggedTemplate = null;
                        }
                    }
                });

                l_cWorkspace.addEventListener('click', (l_cE) => {
                    if(l_cE.target === l_cWorkspace) {
                        this.G_cSelectedElement = null;
                        this.f_vRenderAll();
                        this.f_vRenderProperties();
                    }
                });
            }

            f_vSetupElementDrag(p_cElement, p_cDOMElement) {
                let l_iStartX, l_iStartY, l_iInitialLeft, l_iInitialTop;

                p_cDOMElement.addEventListener('mousedown', (l_cE) => {
                    if(l_cE.target.classList.contains('c-resize-handle')) return;
                    
                    l_cE.stopPropagation();
                    this.F_vSelectElement(p_cElement, l_cE.ctrlKey || l_cE.metaKey);
                    
                    this.G_bIsDragging = true;
                    p_cDOMElement.classList.add('c-dragging');
                    
                    l_iStartX = l_cE.clientX;
                    l_iStartY = l_cE.clientY;
                    l_iInitialLeft = parseInt(p_cElement.attributes.style.left) || 0;
                    l_iInitialTop = parseInt(p_cElement.attributes.style.top) || 0;

                    const f_vMouseMove = (l_cE) => {
                        if(!this.G_bIsDragging) return;
                        
                        const l_iDeltaX = l_cE.clientX - l_iStartX;
                        const l_iDeltaY = l_cE.clientY - l_iStartY;
                        
                        p_cElement.attributes.style.left = (l_iInitialLeft + l_iDeltaX) + 'px';
                        p_cElement.attributes.style.top = (l_iInitialTop + l_iDeltaY) + 'px';
                        
                        this.f_vRenderAll();
                        this.f_vUpdateCSSEditor(); // Mise à jour en temps réel
                    };

                    const f_vMouseUp = () => {
                        this.G_bIsDragging = false;
                        p_cDOMElement.classList.remove('c-dragging');
                        document.removeEventListener('mousemove', f_vMouseMove);
                        document.removeEventListener('mouseup', f_vMouseUp);
                        this.f_vUpdateCSSEditor(); // Mise à jour finale
                    };

                    document.addEventListener('mousemove', f_vMouseMove);
                    document.addEventListener('mouseup', f_vMouseUp);
                });
            }

            f_vSetupResizeHandles(p_cElement, p_cDOMElement) {
                const l_lHandles = ['nw', 'ne', 'sw', 'se'];
                
                l_lHandles.forEach(l_sDirection => {
                    const l_cHandle = document.createElement('div');
                    l_cHandle.className = `c-resize-handle ${l_sDirection}`;
                    
                    l_cHandle.addEventListener('mousedown', (l_cE) => {
                        l_cE.stopPropagation();
                        this.G_bIsResizing = true;
                        
                        const l_iStartX = l_cE.clientX;
                        const l_iStartY = l_cE.clientY;
                        const l_iInitialWidth = parseInt(p_cElement.attributes.style.width) || p_cDOMElement.offsetWidth;
                        const l_iInitialHeight = parseInt(p_cElement.attributes.style.height) || p_cDOMElement.offsetHeight;
                        const l_iInitialLeft = parseInt(p_cElement.attributes.style.left) || 0;
                        const l_iInitialTop = parseInt(p_cElement.attributes.style.top) || 0;

                        const f_vMouseMove = (l_cE) => {
                            if(!this.G_bIsResizing) return;
                            
                            const l_iDeltaX = l_cE.clientX - l_iStartX;
                            const l_iDeltaY = l_cE.clientY - l_iStartY;
                            
                            if(l_sDirection.includes('e')) {
                                p_cElement.attributes.style.width = Math.max(50, l_iInitialWidth + l_iDeltaX) + 'px';
                            }
                            if(l_sDirection.includes('w')) {
                                p_cElement.attributes.style.width = Math.max(50, l_iInitialWidth - l_iDeltaX) + 'px';
                                p_cElement.attributes.style.left = (l_iInitialLeft + l_iDeltaX) + 'px';
                            }
                            if(l_sDirection.includes('s')) {
                                p_cElement.attributes.style.height = Math.max(30, l_iInitialHeight + l_iDeltaY) + 'px';
                            }
                            if(l_sDirection.includes('n')) {
                                p_cElement.attributes.style.height = Math.max(30, l_iInitialHeight - l_iDeltaY) + 'px';
                                p_cElement.attributes.style.top = (l_iInitialTop + l_iDeltaY) + 'px';
                            }
                            
                            this.f_vRenderAll();
                            this.f_vUpdateCSSEditor(); // Mise à jour en temps réel
                        };

                        const f_vMouseUp = () => {
                            this.G_bIsResizing = false;
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
                this.G_lElements.forEach(l_cEl => this.f_vRenderElement(l_cEl, l_cWorkspace));
                this.f_vRenderTree();
                
                // NE PAS exécuter les actions "load" dans l'éditeur
                // Elles seront exécutées uniquement dans l'export
            }

            f_vRenderElement(p_cElement, p_cParent) {
                const l_cDiv = document.createElement(p_cElement.type);
                l_cDiv.id = p_cElement.id;
                l_cDiv.className = 'c-element ' + (p_cElement.attributes.className || '');
                if(this.G_cSelectedElement?.id === p_cElement.id) {
                    l_cDiv.classList.add('selected');
                    this.f_vSetupResizeHandles(p_cElement, l_cDiv);
                }
                
                Object.assign(l_cDiv.style, p_cElement.attributes.style);
                l_cDiv.innerHTML = p_cElement.attributes.innerHTML || '';
                
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
                        
                        this.f_vRenderAll();
                        this.f_vRenderTree();
                        this.G_cDraggedComponent = null;
                        this.G_cDraggedTemplate = null;
                    }
                });
            }

            f_vRenderTree() {
                const l_cTree = document.getElementById('G_sTreeView');
                l_cTree.innerHTML = `
                    <h3 style="margin-bottom: 10px; color: #0078d4;">📋 Arborescence</h3>
                    <div id="G_sTreeRoot" class="c-tree-root" style="padding: 10px; background: #1a1a1a; border: 2px dashed #555; border-radius: 4px; margin-bottom: 10px; text-align: center; color: #999;">
                        🏠 Racine (glissez ici pour extraire)
                    </div>
                `;
                this.G_lElements.forEach(l_cEl => this.f_vRenderTreeItem(l_cEl, l_cTree, 0));
                this.f_vSetupTreeDragDrop();
            }

            f_vRenderTreeItem(p_cElement, p_cParent, p_iLevel) {
                const l_cDiv = document.createElement('div');
                l_cDiv.className = 'c-tree-item' + (this.G_cSelectedElement?.id === p_cElement.id ? ' selected' : '');
                l_cDiv.dataset.elementId = p_cElement.id;
                l_cDiv.draggable = true;
                
                const l_sIcon = p_cElement.children.length ? '📁' : this.f_sGetElementIcon(p_cElement.type);
                l_cDiv.innerHTML = `
                    <span class="c-tree-toggle">${p_cElement.children.length ? '▼' : '•'}</span>
                    <div class="c-tree-item-content">
                        <span>${l_sIcon}</span>
                        <span>${p_cElement.type}</span>
                        <span class="c-tree-item-type">${p_cElement.id}</span>
                    </div>
                `;
                
                l_cDiv.addEventListener('click', (l_cE) => {
                    l_cE.stopPropagation();
                    this.F_vSelectElement(p_cElement, l_cE.ctrlKey || l_cE.metaKey);
                });

                p_cParent.appendChild(l_cDiv);
                
                if(p_cElement.children.length > 0) {
                    const l_cChildren = document.createElement('div');
                    l_cChildren.className = 'c-tree-children';
                    p_cElement.children.forEach(l_cChild => this.f_vRenderTreeItem(l_cChild, l_cChildren, p_iLevel + 1));
                    p_cParent.appendChild(l_cChildren);
                }
            }

            f_sGetElementIcon(p_sType) {
                const icons = {
                    'div': '📦', 'button': '🔘', 'input': '📝', 'textarea': '📄',
                    'select': '📋', 'p': '📰', 'h1': '🔤', 'h2': '🔤', 'h3': '🔤',
                    'img': '🖼️', 'form': '📋', 'ul': '📑', 'table': '📊', 'a': '🔗',
                    'card': '🎴', 'navbar': '🧭', 'modal': '🪟', 'datatable': '📊'
                };
                return icons[p_sType] || '📄';
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

            f_vRenderProperties() {
                const l_cPanel = document.getElementById('G_sProperties');
                if(!this.G_cSelectedElement) {
                    l_cPanel.innerHTML = '<p style="color: #666;">Sélectionnez un élément</p>';
                    return;
                }

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
                        <div class="c-property">
                            <label>Contenu HTML</label>
                            ${this.G_cSelectedElement.type === 'form' ? 
                                `<button class="c-btn" onclick="G_cApp.f_vOpenFormEditor()" style="width: 100%; margin-bottom: 10px;">✏️ Éditeur Visuel de Formulaire</button>` : 
                                ''
                            }
                            <textarea id="l_sInnerHTML">${this.G_cSelectedElement.attributes.innerHTML || ''}</textarea>
                        </div>
                        <div class="c-property">
                            <label>Classe CSS</label>
                            <input type="text" id="l_sClassName" value="${this.G_cSelectedElement.attributes.className || ''}">
                        </div>
                    </div>
                    <div class="c-property-group">
                        <h3>État CSS</h3>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px;">
                            <button class="c-pseudo-tab ${l_sCurrentPseudo === 'normal' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('normal')">Normal</button>
                            <button class="c-pseudo-tab ${l_sCurrentPseudo === 'hover' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('hover')">:hover</button>
                            <button class="c-pseudo-tab ${l_sCurrentPseudo === 'active' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('active')">:active</button>
                            <button class="c-pseudo-tab ${l_sCurrentPseudo === 'focus' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('focus')">:focus</button>
                            <button class="c-pseudo-tab ${l_sCurrentPseudo === 'before' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('before')">::before</button>
                            <button class="c-pseudo-tab ${l_sCurrentPseudo === 'after' ? 'active' : ''}" onclick="G_cApp.f_vSelectPseudo('after')">::after</button>
                        </div>
                        <div id="G_sCSSPropertiesList"></div>
                        <button class="c-btn c-btn-add" onclick="G_cApp.f_vAddCSSProperty()" style="width: 100%; margin-top: 10px;">+ Ajouter une propriété CSS</button>
                    </div>
                    <div class="c-property-group">
                        <h3>Actions</h3>
                        <button class="c-btn" onclick="G_cApp.F_vOpenAPIModal()">Gérer Actions API (${this.G_cSelectedElement.apiActions?.length || 0})</button>
                        ${this.G_cSelectedElement.parent ? '<button class="c-btn" style="background: #28a745; margin-top: 10px;" onclick="G_cApp.F_vExtractFromParent()">⬆️ Extraire du parent</button>' : ''}
                        <button class="c-btn" style="background: #d13438; margin-top: 10px;" onclick="G_cApp.F_vDeleteElement()">Supprimer</button>
                    </div>
                `;

                document.getElementById('l_sInnerHTML').addEventListener('input', (e) => {
                    this.G_cSelectedElement.attributes.innerHTML = e.target.value;
                    this.f_vRenderAll();
                });

                document.getElementById('l_sClassName').addEventListener('input', (e) => {
                    this.G_cSelectedElement.attributes.className = e.target.value;
                    this.f_vRenderAll();
                });

                // Rendre la liste CSS
                this.f_vRenderCSSProperties();
            }

            f_vRenderCSSProperties() {
                const container = document.getElementById('G_sCSSPropertiesList');
                if(!container) return;

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
                                   oninput="G_cApp.f_vUpdateCSSPropertyKey('${key}', this.value)"
                                   onchange="G_cApp.f_vUpdateCSSPropertyKey('${key}', this.value)">
                            <input type="text" value="${value}" 
                                   placeholder="valeur" 
                                   style="flex: 2; padding: 6px; font-size: 11px;"
                                   oninput="G_cApp.f_vUpdateCSSPropertyValue('${key}', this.value)"
                                   onchange="G_cApp.f_vUpdateCSSPropertyValue('${key}', this.value)">
                            <button class="c-btn-small" onclick="G_cApp.f_vDeleteCSSProperty('${key}')" style="padding: 6px 8px;">×</button>
                        </div>
                    `;
                });

                if(entries.length === 0) {
                    html = '<p style="color: #666; font-size: 12px; text-align: center; padding: 10px;">Aucune propriété CSS</p>';
                }

                container.innerHTML = html;
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
                    // Ne pas re-render la liste pour ne pas perdre le focus
                    this.f_vRenderAll();
                }
            }

            f_vUpdateCSSPropertyValue(p_sKey, p_sNewValue) {
                const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
                const styles = l_sCurrentPseudo === 'normal' 
                    ? this.G_cSelectedElement.attributes.style 
                    : this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo];

                styles[p_sKey] = p_sNewValue;
                // Mise à jour en temps réel sans re-render de la liste
                this.f_vRenderAll();
            }

            f_vDeleteCSSProperty(p_sKey) {
                const l_sCurrentPseudo = this.G_cSelectedPseudo || 'normal';
                const styles = l_sCurrentPseudo === 'normal' 
                    ? this.G_cSelectedElement.attributes.style 
                    : this.G_cSelectedElement.pseudoStyles[l_sCurrentPseudo];

                delete styles[p_sKey];
                this.f_vRenderCSSProperties();
                this.f_vRenderAll();
            }

            f_vSelectPseudo(p_sPseudo) {
                this.G_cSelectedPseudo = p_sPseudo;
                this.f_vRenderProperties();
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
                    this.f_vRenderAll();
                    this.f_vRenderProperties();
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
                this.f_vRenderAll();
                this.f_vRenderProperties();
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
                const l_cData = {
                    version: '2.1',
                    elements: this.G_lElements.map(e => e.F_cToJSON())
                };
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
                    this.G_lElements = (p_cData.elements || []).map(e => C_Element.F_cFromJSON(e));
                    
                    // Calculer le compteur max en parcourant TOUS les éléments (y compris enfants)
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
                    
                    this.G_iCounter = f_iGetMaxId(this.G_lElements) + 1;
                    this.G_cSelectedElement = null;
                    this.f_vRenderAll();
                    this.f_vRenderProperties();
                    alert('Projet chargé avec succès');
                } catch(e) {
                    alert('Erreur lors du chargement du projet');
                    console.error(e);
                }
            }

            F_vExportZIP() {
                const f_sGenerateHTML = () => {
                    let l_sHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Site</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
`;
                    
                    const f_vGenerateElement = (p_cEl) => {
                        const l_sClass = p_cEl.attributes.className ? ` class="${p_cEl.attributes.className}"` : '';
                        const l_sApiAttr = p_cEl.apiActions?.length ? ` data-api='${JSON.stringify(p_cEl.apiActions)}'` : '';
                        l_sHTML += `    <${p_cEl.type} id="${p_cEl.id}"${l_sClass}${l_sApiAttr}>${p_cEl.attributes.innerHTML || ''}`;
                        p_cEl.children.forEach(c => f_vGenerateElement(c));
                        l_sHTML += `</${p_cEl.type}>\n`;
                    };
                    
                    this.G_lElements.forEach(e => f_vGenerateElement(e));
                    l_sHTML += `    <script src="https://code.jquery.com/jquery-3.6.0.min.js"><\/script>
    <script src="framework.js"><\/script>
</body>
</html>`;
                    return l_sHTML;
                };

                const f_sGenerateCSS = () => {
                    let l_sCSS = 'body { margin: 0; padding: 0; font-family: Arial, sans-serif; }\n\n';
                    
                    // Générer le CSS pour chaque élément
                    const f_vGenerateElementCSS = (p_cEl) => {
                        if(p_cEl.attributes.style && Object.keys(p_cEl.attributes.style).length > 0) {
                            l_sCSS += `#${p_cEl.id} {\n`;
                            
                            for(let [key, value] of Object.entries(p_cEl.attributes.style)) {
                                // Convertir camelCase en kebab-case
                                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                                l_sCSS += `    ${cssKey}: ${value};\n`;
                            }
                            
                            l_sCSS += `}\n\n`;
                        }

                        // Ajouter les pseudo-classes et pseudo-éléments
                        if(p_cEl.pseudoStyles) {
                            for(let [pseudo, styles] of Object.entries(p_cEl.pseudoStyles)) {
                                if(Object.keys(styles).length > 0) {
                                    const pseudoSelector = ['before', 'after'].includes(pseudo) ? `::${pseudo}` : `:${pseudo}`;
                                    l_sCSS += `#${p_cEl.id}${pseudoSelector} {\n`;
                                    
                                    for(let [key, value] of Object.entries(styles)) {
                                        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                                        l_sCSS += `    ${cssKey}: ${value};\n`;
                                    }
                                    
                                    l_sCSS += `}\n\n`;
                                }
                            }
                        }
                        
                        // Récursif pour les enfants
                        p_cEl.children.forEach(c => f_vGenerateElementCSS(c));
                    };
                    
                    this.G_lElements.forEach(e => f_vGenerateElementCSS(e));
                    
                    return l_sCSS;
                };

                const f_sGenerateJS = () => {
                    return '';
                };

                const l_sHTML = f_sGenerateHTML();
                const l_sCSS = f_sGenerateCSS();
                const l_sJS = f_sGenerateJS();

                // Create ZIP
                const zip = new JSZip();
                zip.file('index.html', l_sHTML);
                zip.file('style.css', l_sCSS);
                zip.file('framework.js', this.f_sGenerateFramework());

                zip.generateAsync({type: 'blob'}).then(content => {
                    const url = URL.createObjectURL(content);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'export.zip';
                    link.click();
                });
            }

            f_sGenerateFramework() {
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
            alert('Erreur API: ' + error.message);
            throw error;
        }
    }

    F_vPopup(p_sMessage) {
        alert(p_sMessage);
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

document.addEventListener('DOMContentLoaded', () => {
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
});
`;
            }

            F_vExportJSON() {
                const project = {
                    version: '2.1',
                    elements: this.G_lElements.map(e => e.F_cToJSON()),
                    timestamp: new Date().toISOString()
                };
                const json = JSON.stringify(project, null, 2);
                const blob = new Blob([json], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'project.json';
                link.click();
            }

            F_vImportJSON() {
                document.getElementById('G_sFileInput').click();
            }

            F_vClear() {
                if(confirm('Effacer tout le projet ?')) {
                    this.G_lElements = [];
                    this.G_cSelectedElement = null;
                    this.G_iCounter = 0;
                    this.f_vRenderAll();
                }
            }

            f_vShowShortcuts() {
                document.getElementById('G_sShortcutsModal').style.display = 'block';
            }

            f_vCloseShortcuts() {
                document.getElementById('G_sShortcutsModal').style.display = 'none';
            }
        }

        const G_cApp = new C_App();
    </script>
</body>
</html>