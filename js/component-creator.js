/**
 * Créateur de Composants UI Réutilisables
 * Permet de créer, éditer et exporter des composants UI personnalisés
 */
class C_ComponentCreator {
    constructor() {
        this.G_lComponents = []; // Liste des composants créés
        this.G_cCurrentComponent = null; // Composant en cours d'édition
        this.G_lElements = []; // Éléments du composant actuel
        this.G_cSelectedElement = null; // Élément sélectionné
        this.G_iComponentCounter = 1;
        
        this.f_vInit();
    }
    
    async f_vInit() {
        // Charger les composants sauvegardés depuis localStorage
        this.f_vLoadComponents();
        this.f_vRenderComponentsList();
        
        // Setup du workspace similaire à l'éditeur principal
        this.f_vSetupWorkspace();
    }
    
    // ========== GESTION DES COMPOSANTS ==========
    
    f_vLoadComponents() {
        const saved = localStorage.getItem('custom_components');
        if(saved) {
            try {
                this.G_lComponents = JSON.parse(saved);
            } catch(e) {
                console.error('Erreur de chargement des composants:', e);
                this.G_lComponents = [];
            }
        }
    }
    
    f_vSaveComponentsToStorage() {
        localStorage.setItem('custom_components', JSON.stringify(this.G_lComponents));
    }
    
    f_vCreateNewComponent() {
        const componentName = prompt('Nom du nouveau composant:', `Composant ${this.G_iComponentCounter}`);
        if(!componentName) return;
        
        const newComponent = {
            id: `component_${Date.now()}`,
            name: componentName,
            icon: '🧩',
            description: 'Nouveau composant personnalisé',
            elements: [],
            parameters: {}, // Paramètres configurables
            css: {},
            html: '',
            category: 'custom'
        };
        
        this.G_lComponents.push(newComponent);
        this.G_iComponentCounter++;
        this.f_vSaveComponentsToStorage();
        this.f_vRenderComponentsList();
        this.f_vLoadComponent(newComponent);
    }
    
    f_vLoadComponent(component) {
        this.G_cCurrentComponent = component;
        this.G_lElements = component.elements.map(el => C_Element.F_cFromJSON(el));
        
        this.f_vRenderWorkspace();
        this.f_vRenderProperties();
        
        // Marquer comme actif dans la liste
        document.querySelectorAll('.c-component-list-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-component-id="${component.id}"]`);
        if(activeItem) activeItem.classList.add('active');
    }
    
    f_vSaveComponent() {
        if(!this.G_cCurrentComponent) {
            alert('Aucun composant sélectionné');
            return;
        }
        
        // Mettre à jour les éléments du composant
        this.G_cCurrentComponent.elements = this.G_lElements.map(el => el.F_cToJSON());
        
        // Sauvegarder dans localStorage
        this.f_vSaveComponentsToStorage();
        
        this.f_vShowToast('✅ Composant sauvegardé', 'success');
    }
    
    f_vExportComponent() {
        if(!this.G_cCurrentComponent) {
            alert('Aucun composant sélectionné');
            return;
        }
        
        // Exporter en JSON
        const json = JSON.stringify(this.G_cCurrentComponent, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.G_cCurrentComponent.name}.json`;
        link.click();
        
        this.f_vShowToast('📦 Composant exporté', 'success');
    }
    
    f_vDeleteComponent(componentId) {
        if(!confirm('Supprimer ce composant ?')) return;
        
        this.G_lComponents = this.G_lComponents.filter(c => c.id !== componentId);
        this.f_vSaveComponentsToStorage();
        this.f_vRenderComponentsList();
        
        if(this.G_cCurrentComponent && this.G_cCurrentComponent.id === componentId) {
            this.G_cCurrentComponent = null;
            this.G_lElements = [];
            this.f_vRenderWorkspace();
        }
        
        this.f_vShowToast('🗑️ Composant supprimé', 'info');
    }
    
    f_vDuplicateComponent(componentId) {
        const component = this.G_lComponents.find(c => c.id === componentId);
        if(!component) return;
        
        const duplicate = JSON.parse(JSON.stringify(component));
        duplicate.id = `component_${Date.now()}`;
        duplicate.name = `${component.name} (copie)`;
        
        this.G_lComponents.push(duplicate);
        this.f_vSaveComponentsToStorage();
        this.f_vRenderComponentsList();
        
        this.f_vShowToast('📋 Composant dupliqué', 'success');
    }
    
    // ========== RENDU DE L'INTERFACE ==========
    
    f_vRenderComponentsList() {
        const list = document.getElementById('G_sComponentsList');
        
        if(this.G_lComponents.length === 0) {
            list.innerHTML = '<p style="color: #666; font-size: 13px; text-align: center;">Aucun composant créé</p>';
            return;
        }
        
        list.innerHTML = this.G_lComponents.map(comp => `
            <div class="c-component-list-item" data-component-id="${comp.id}" onclick="G_cComponentCreator.f_vLoadComponent(${JSON.stringify(comp).replace(/"/g, '&quot;')})">
                <div>
                    <div style="font-size: 16px; margin-bottom: 5px;">${comp.icon} ${comp.name}</div>
                    <div style="font-size: 12px; color: #999;">${comp.elements.length} élément(s)</div>
                </div>
                <div class="c-component-actions">
                    <button onclick="event.stopPropagation(); G_cComponentCreator.f_vDuplicateComponent('${comp.id}')" title="Dupliquer">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button onclick="event.stopPropagation(); G_cComponentCreator.f_vDeleteComponent('${comp.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    f_vSetupWorkspace() {
        const workspace = document.getElementById('G_sComponentPreview');
        
        // Ajouter les éléments de base HTML (similaire à l'éditeur principal)
        workspace.addEventListener('click', (e) => {
            if(e.target === workspace) {
                this.G_cSelectedElement = null;
                this.f_vRenderProperties();
            }
        });
    }
    
    f_vRenderWorkspace() {
        const preview = document.getElementById('G_sComponentPreview');
        
        if(!this.G_cCurrentComponent) {
            preview.innerHTML = `
                <div style="text-align: center; color: #999; padding: 60px;">
                    <i class="fas fa-cube" style="font-size: 48px; margin-bottom: 20px; display: block;"></i>
                    <p>Créez un nouveau composant ou sélectionnez-en un existant</p>
                </div>
            `;
            return;
        }
        
        preview.innerHTML = '';
        
        // Afficher les éléments
        this.G_lElements.forEach(el => this.f_vRenderElement(el, preview));
    }
    
    f_vRenderElement(element, parent) {
        const div = document.createElement(element.type);
        div.id = element.id;
        div.className = 'c-element ' + (element.attributes.className || '');
        
        Object.assign(div.style, element.attributes.style);
        div.innerHTML = element.attributes.innerHTML || '';
        
        // Sélection au clic
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.G_cSelectedElement = element;
            this.f_vRenderProperties();
            
            // Mettre en surbrillance
            document.querySelectorAll('.c-element').forEach(el => el.style.outline = '');
            div.style.outline = '2px solid #0078d4';
        });
        
        parent.appendChild(div);
        
        // Rendre les enfants
        element.children.forEach(child => this.f_vRenderElement(child, div));
    }
    
    f_vRenderProperties() {
        const panel = document.getElementById('G_sPropertiesContent');
        
        if(!this.G_cCurrentComponent) {
            panel.innerHTML = '<p style="color: #666;">Aucun composant sélectionné</p>';
            return;
        }
        
        if(!this.G_cSelectedElement) {
            panel.innerHTML = `
                <div class="c-property-group">
                    <h3>Composant: ${this.G_cCurrentComponent.name}</h3>
                    <div class="c-property">
                        <label>Nom</label>
                        <input type="text" value="${this.G_cCurrentComponent.name}" onchange="G_cComponentCreator.f_vUpdateComponentName(this.value)">
                    </div>
                    <div class="c-property">
                        <label>Icône (emoji)</label>
                        <input type="text" value="${this.G_cCurrentComponent.icon}" onchange="G_cComponentCreator.f_vUpdateComponentIcon(this.value)" maxlength="2">
                    </div>
                    <div class="c-property">
                        <label>Description</label>
                        <textarea onchange="G_cComponentCreator.f_vUpdateComponentDescription(this.value)" rows="3" style="width: 100%; background: #2d2d2d; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px;">${this.G_cCurrentComponent.description}</textarea>
                    </div>
                </div>
                <div class="c-property-group">
                    <h3>Ajouter un élément</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button class="c-btn" onclick="G_cComponentCreator.f_vAddElement('div')" style="font-size: 12px; padding: 8px;">
                            <i class="fas fa-square"></i> DIV
                        </button>
                        <button class="c-btn" onclick="G_cComponentCreator.f_vAddElement('button')" style="font-size: 12px; padding: 8px;">
                            <i class="fas fa-hand-pointer"></i> Button
                        </button>
                        <button class="c-btn" onclick="G_cComponentCreator.f_vAddElement('input')" style="font-size: 12px; padding: 8px;">
                            <i class="fas fa-edit"></i> Input
                        </button>
                        <button class="c-btn" onclick="G_cComponentCreator.f_vAddElement('p')" style="font-size: 12px; padding: 8px;">
                            <i class="fas fa-paragraph"></i> Texte
                        </button>
                        <button class="c-btn" onclick="G_cComponentCreator.f_vAddElement('img')" style="font-size: 12px; padding: 8px;">
                            <i class="fas fa-image"></i> Image
                        </button>
                        <button class="c-btn" onclick="G_cComponentCreator.f_vAddElement('a')" style="font-size: 12px; padding: 8px;">
                            <i class="fas fa-link"></i> Lien
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Propriétés de l'élément sélectionné
        panel.innerHTML = `
            <div class="c-property-group">
                <h3>Élément sélectionné</h3>
                <div class="c-property">
                    <label>Type</label>
                    <input type="text" value="${this.G_cSelectedElement.type}" readonly>
                </div>
                <div class="c-property">
                    <label>ID</label>
                    <input type="text" value="${this.G_cSelectedElement.id}" readonly>
                </div>
                <div class="c-property">
                    <label>Contenu HTML</label>
                    <textarea rows="4" onchange="G_cComponentCreator.f_vUpdateElementHTML(this.value)" style="width: 100%; background: #2d2d2d; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px; font-family: monospace;">${this.G_cSelectedElement.attributes.innerHTML || ''}</textarea>
                </div>
                <button class="c-btn c-btn-danger" onclick="G_cComponentCreator.f_vDeleteElement()" style="width: 100%; margin-top: 10px;">
                    <i class="fas fa-trash"></i> Supprimer l'élément
                </button>
            </div>
        `;
    }
    
    // ========== MANIPULATION DES ÉLÉMENTS ==========
    
    f_vAddElement(type) {
        if(!this.G_cCurrentComponent) return;
        
        const newElement = new C_Element(type, `${type}_${Date.now()}`);
        
        // Valeurs par défaut selon le type
        switch(type) {
            case 'button':
                newElement.attributes.innerHTML = 'Cliquez ici';
                newElement.attributes.style = {
                    padding: '10px 20px',
                    background: '#0078d4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                };
                break;
            case 'input':
                newElement.attributes.style = {
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '200px'
                };
                break;
            case 'p':
                newElement.attributes.innerHTML = 'Texte du paragraphe';
                newElement.attributes.style = {
                    margin: '10px 0',
                    lineHeight: '1.6'
                };
                break;
            case 'img':
                newElement.attributes.innerHTML = '';
                newElement.attributes.style = {
                    width: '200px',
                    height: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                };
                break;
            case 'a':
                newElement.attributes.innerHTML = 'Lien';
                newElement.attributes.style = {
                    color: '#0078d4',
                    textDecoration: 'none'
                };
                break;
            case 'div':
                newElement.attributes.style = {
                    padding: '20px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    minHeight: '100px'
                };
                break;
        }
        
        this.G_lElements.push(newElement);
        this.f_vRenderWorkspace();
        this.f_vShowToast(`✅ ${type.toUpperCase()} ajouté`, 'success');
    }
    
    f_vDeleteElement() {
        if(!this.G_cSelectedElement) return;
        
        this.G_lElements = this.G_lElements.filter(el => el.id !== this.G_cSelectedElement.id);
        this.G_cSelectedElement = null;
        
        this.f_vRenderWorkspace();
        this.f_vRenderProperties();
        this.f_vShowToast('🗑️ Élément supprimé', 'info');
    }
    
    f_vUpdateElementHTML(html) {
        if(!this.G_cSelectedElement) return;
        
        this.G_cSelectedElement.attributes.innerHTML = html;
        this.f_vRenderWorkspace();
    }
    
    f_vUpdateComponentName(name) {
        if(!this.G_cCurrentComponent) return;
        
        this.G_cCurrentComponent.name = name;
        this.f_vRenderComponentsList();
    }
    
    f_vUpdateComponentIcon(icon) {
        if(!this.G_cCurrentComponent) return;
        
        this.G_cCurrentComponent.icon = icon;
        this.f_vRenderComponentsList();
    }
    
    f_vUpdateComponentDescription(desc) {
        if(!this.G_cCurrentComponent) return;
        
        this.G_cCurrentComponent.description = desc;
    }
    
    // ========== NOTIFICATIONS ==========
    
    f_vShowToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `c-toast c-toast-${type}`;
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0078d4'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Animation CSS pour les toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
