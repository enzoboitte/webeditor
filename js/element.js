/**
 * Classe C_Element - Représente un élément de l'éditeur
 */
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
        this.m_cNavigationLinks = []; // Liens de navigation vers d'autres pages
        this.pseudoStyles = {
            hover: {},
            active: {},
            focus: {},
            before: {},
            after: {}
        };
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
            m_cNavigationLinks: this.m_cNavigationLinks || [],
            pseudoStyles: this.pseudoStyles,
            children: this.children.map(c => c.F_cToJSON())
        };
    }

    static F_cFromJSON(p_cData) {
        const l_cElement = new C_Element(p_cData.type, p_cData.id);
        l_cElement.attributes = p_cData.attributes;
        l_cElement.parameters = p_cData.parameters || {};
        l_cElement.apiActions = p_cData.apiActions || [];
        l_cElement.m_cNavigationLinks = p_cData.m_cNavigationLinks || [];
        l_cElement.pseudoStyles = p_cData.pseudoStyles || {
            hover: {},
            active: {},
            focus: {},
            before: {},
            after: {}
        };
        l_cElement.children = (p_cData.children || []).map(c => C_Element.F_cFromJSON(c));
        l_cElement.children.forEach(c => c.parent = l_cElement);
        return l_cElement;
    }
}
