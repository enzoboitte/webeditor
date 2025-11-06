/**
 * Classe C_SyntaxHighlighter - Système de coloration syntaxique paramétrable
 * Supporte HTML, CSS, JavaScript, JSON et peut être étendu pour d'autres langages
 */
class C_SyntaxHighlighter {
    constructor(p_sLanguage = 'html') {
        this.G_sLanguage = p_sLanguage;
        this.G_cRules = this.f_cGetLanguageRules(p_sLanguage);
    }

    /**
     * Définir les règles de coloration pour chaque langage
     * IMPORTANT: L'ordre des règles est crucial - les patterns plus spécifiques doivent être appliqués en premier
     */
    f_cGetLanguageRules(p_sLanguage) {
        const rules = {
            html: [
                // Commentaires HTML (en premier pour éviter de colorer leur contenu)
                { pattern: /(&lt;!--[\s\S]*?--&gt;)/g, class: 'c-syntax-html-comment', token: true },
                // Doctype
                { pattern: /(&lt;!DOCTYPE[^&]*&gt;)/gi, class: 'c-syntax-html-comment', token: true },
                // Valeurs d'attributs AVANT de traiter les balises (important!)
                { pattern: /="([^"]*)"/g, 
                  replacement: '="<span class="c-syntax-html-attr-value">$1</span>"',
                  custom: true, token: true },
                { pattern: /='([^']*)'/g, 
                  replacement: '=\'<span class="c-syntax-html-attr-value">$1</span>\'',
                  custom: true, token: true },
                // Noms d'attributs
                { pattern: /\s([a-zA-Z][\w:-]*)(?==)/g, 
                  replacement: ' <span class="c-syntax-html-attr-name">$1</span>',
                  custom: true },
                // Noms de balises (après les attributs)
                { pattern: /&lt;\/?([\w-]+)/g, 
                  replacement: (match, tagName) => {
                    return match.replace(tagName, `<span class="c-syntax-html-tag">${tagName}</span>`);
                  },
                  custom: true }
            ],
            css: [
                // Commentaires CSS (en premier)
                { pattern: /(\/\*[\s\S]*?\*\/)/g, class: 'c-syntax-css-comment', token: true },
                // Strings (avant les valeurs)
                { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'c-syntax-css-value', token: true },
                // !important
                { pattern: /\s*(!important)\b/gi, class: 'c-syntax-css-important', token: true },
                // Propriétés CSS (amélioration)
                { pattern: /([a-zA-Z-]+)\s*:/g, class: 'c-syntax-css-property', group: 1 },
                // Couleurs hexadécimales
                { pattern: /(#[0-9a-fA-F]{3,8})\b/g, class: 'c-syntax-css-value', token: true },
                // Nombres avec unités
                { pattern: /\b(\d+\.?\d*)(px|em|rem|%|vh|vw|vmin|vmax|deg|rad|turn|s|ms|fr|ch|ex)\b/g, 
                  class: 'c-syntax-css-value', token: true },
                // Fonctions CSS
                { pattern: /\b([a-z-]+)(\()/g, class: 'c-syntax-js-function', group: 1 }
            ],
            javascript: [
                // Commentaires (en premier)
                { pattern: /(\/\/.*$)/gm, class: 'c-syntax-js-comment', token: true },
                { pattern: /(\/\*[\s\S]*?\*\/)/g, class: 'c-syntax-js-comment', token: true },
                // Template literals (backticks)
                { pattern: /(`(?:[^`\\]|\\.)*`)/g, class: 'c-syntax-string', token: true },
                // Strings avec doubles guillemets
                { pattern: /("(?:[^"\\]|\\.)*")/g, class: 'c-syntax-string', token: true },
                // Strings avec simples guillemets
                { pattern: /('(?:[^'\\]|\\.)*')/g, class: 'c-syntax-string', token: true },
                // Regex literals
                { pattern: /\/(?![*\/])(?:[^\/\\\n]|\\.)+\/[gimyus]*/g, class: 'c-syntax-string', token: true },
                // Mots-clés
                { pattern: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|import|export|from|default|new|this|typeof|instanceof|async|await|try|catch|finally|throw|in|of|void|delete|yield|static|get|set|super)\b/g, 
                  class: 'c-syntax-js-keyword', token: true },
                // Booléens et null/undefined
                { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, class: 'c-syntax-json-boolean', token: true },
                // Nombres (hex, binary, octal, decimal)
                { pattern: /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:e[+-]?\d+)?)\b/g, 
                  class: 'c-syntax-js-number', token: true },
                // Fonctions (nom suivi de parenthèse)
                { pattern: /\b([a-zA-Z_$][\w$]*)(?=\s*\()/g, class: 'c-syntax-js-function' }
            ],
            json: [
                // Strings (en premier pour éviter de colorer les clés comme des strings normales)
                { pattern: /"((?:[^"\\]|\\.)*)"/g, 
                  replacement: (match, content, offset, string) => {
                    // Vérifier si c'est une clé (suivie de :) ou une valeur
                    const afterMatch = string.substring(offset + match.length).trim();
                    if (afterMatch.startsWith(':')) {
                      // C'est une clé - guillemets INCLUS
                      return `<span class="c-syntax-json-key">"${content}"</span>`;
                    } else {
                      // C'est une string value - guillemets INCLUS en vert
                      return `<span class="c-syntax-string">"${content}"</span>`;
                    }
                  },
                  custom: true },
                // Strings avec guillemets simples (moins standard en JSON mais supporté)
                { pattern: /'((?:[^'\\]|\\.)*)'/g, 
                  replacement: `<span class="c-syntax-string">'$1'</span>`,
                  custom: true, token: true },
                // Nombres
                { pattern: /:\s*(-?\d+\.?\d*(?:e[+-]?\d+)?)/g, class: 'c-syntax-js-number', group: 1 },
                // Booléens
                { pattern: /\b(true|false)\b/g, class: 'c-syntax-json-boolean', token: true },
                // Null
                { pattern: /\b(null)\b/g, class: 'c-syntax-json-null', token: true }
            ],
            python: [
                // Docstrings et multiline strings (en premier)
                { pattern: /("""[\s\S]*?"""|'''[\s\S]*?''')/g, class: 'c-syntax-string', token: true },
                // Commentaires
                { pattern: /(#.*$)/gm, class: 'c-syntax-js-comment', token: true },
                // Strings
                { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'c-syntax-string', token: true },
                // Mots-clés
                { pattern: /\b(def|class|import|from|as|if|elif|else|for|while|return|yield|lambda|with|try|except|finally|raise|pass|break|continue|and|or|not|is|in|assert|del|global|nonlocal)\b/g, 
                  class: 'c-syntax-js-keyword', token: true },
                // Booléens et None
                { pattern: /\b(True|False|None)\b/g, class: 'c-syntax-json-boolean', token: true },
                // Nombres
                { pattern: /\b(\d+\.?\d*(?:e[+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)\b/g, 
                  class: 'c-syntax-js-number', token: true },
                // Décorateurs
                { pattern: /(@\w+)/g, class: 'c-syntax-css-important', token: true },
                // Fonctions
                { pattern: /\b([a-zA-Z_]\w*)(?=\s*\()/g, class: 'c-syntax-js-function' }
            ],
            php: [
                // Balises PHP
                { pattern: /(&lt;\?php|\?&gt;|&lt;\?=)/g, class: 'c-syntax-html-tag', token: true },
                // Commentaires
                { pattern: /(\/\/.*$)/gm, class: 'c-syntax-js-comment', token: true },
                { pattern: /(\/\*[\s\S]*?\*\/)/g, class: 'c-syntax-js-comment', token: true },
                { pattern: /(#.*$)/gm, class: 'c-syntax-js-comment', token: true },
                // Strings
                { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'c-syntax-string', token: true },
                // Mots-clés
                { pattern: /\b(function|return|if|else|elseif|for|foreach|while|do|switch|case|default|break|continue|class|interface|trait|extends|implements|public|private|protected|static|final|abstract|const|new|echo|print|require|require_once|include|include_once|namespace|use|as|try|catch|finally|throw|array|isset|empty|unset|die|exit|clone|instanceof)\b/g, 
                  class: 'c-syntax-js-keyword', token: true },
                // Booléens et null
                { pattern: /\b(true|false|null|TRUE|FALSE|NULL)\b/g, class: 'c-syntax-json-boolean', token: true },
                // Variables PHP
                { pattern: /(\$[a-zA-Z_]\w*)/g, class: 'c-syntax-css-important', token: true },
                // Nombres
                { pattern: /\b(\d+\.?\d*(?:e[+-]?\d+)?|0x[0-9a-fA-F]+)\b/g, class: 'c-syntax-js-number', token: true },
                // Fonctions
                { pattern: /\b([a-zA-Z_]\w*)(?=\s*\()/g, class: 'c-syntax-js-function' }
            ]
        };

        return rules[p_sLanguage] || rules.html;
    }

    /**
     * Échapper les caractères HTML
     * NE PAS échapper les guillemets pour permettre la détection des strings
     */
    f_sEscapeHTML(p_sText) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        };
        return p_sText.replace(/[&<>]/g, m => map[m]);
    }

    /**
     * Appliquer la coloration syntaxique
     * Utilise un système de tokens pour éviter les conflits entre règles
     */
    f_sHighlight(p_sCode) {
        // Échapper le HTML
        let highlighted = this.f_sEscapeHTML(p_sCode);
        
        // Système de protection par tokens pour éviter les re-colorations
        const tokens = [];
        let tokenIndex = 0;
        
        // Fonction pour sauvegarder un token
        const saveToken = (content) => {
            const token = `___TOKEN_${tokenIndex}___`;
            tokens[tokenIndex] = content;
            tokenIndex++;
            return token;
        };
        
        // Fonction pour restaurer les tokens
        const restoreTokens = (text) => {
            let result = text;
            for (let i = 0; i < tokens.length; i++) {
                result = result.replace(`___TOKEN_${i}___`, tokens[i]);
            }
            return result;
        };

        // Appliquer chaque règle
        this.G_cRules.forEach(rule => {
            const { pattern, class: className, group, token, custom, replacement, quotes } = rule;
            
            if (custom && replacement) {
                // Règle avec remplacement personnalisé
                if (typeof replacement === 'function') {
                    highlighted = highlighted.replace(pattern, replacement);
                } else {
                    highlighted = highlighted.replace(pattern, replacement);
                }
                // Si c'est un token, protéger le résultat
                if (token) {
                    highlighted = highlighted.replace(/<span class="[^"]*">.*?<\/span>/g, match => saveToken(match));
                }
            } else if (group !== undefined) {
                // Si on cible un groupe spécifique
                highlighted = highlighted.replace(pattern, (match, ...groups) => {
                    const targetGroup = groups[group - 1];
                    if (!targetGroup) return match;
                    
                    const beforeIndex = match.indexOf(targetGroup);
                    const before = match.substring(0, beforeIndex);
                    const after = match.substring(beforeIndex + targetGroup.length);
                    
                    let wrappedGroup;
                    if (quotes) {
                        // Pour les attributs HTML avec guillemets
                        wrappedGroup = `<span class="${className}">${targetGroup}</span>`;
                    } else {
                        wrappedGroup = `<span class="${className}">${targetGroup}</span>`;
                    }
                    
                    const result = `${before}${wrappedGroup}${after}`;
                    
                    // Si c'est un token, le protéger
                    if (token) {
                        return saveToken(result);
                    }
                    return result;
                });
            } else {
                // Colorer tout le match
                highlighted = highlighted.replace(pattern, (match, captured) => {
                    const result = `<span class="${className}">${captured || match}</span>`;
                    // Si c'est un token, le protéger
                    if (token) {
                        return saveToken(result);
                    }
                    return result;
                });
            }
        });
        
        // Restaurer tous les tokens protégés
        highlighted = restoreTokens(highlighted);

        return highlighted;
    }

    /**
     * Changer le langage
     */
    f_vSetLanguage(p_sLanguage) {
        this.G_sLanguage = p_sLanguage;
        this.G_cRules = this.f_cGetLanguageRules(p_sLanguage);
    }

    /**
     * Ajouter des règles personnalisées
     */
    f_vAddCustomRule(p_cRule) {
        this.G_cRules.push(p_cRule);
    }

    /**
     * Créer un éditeur avec coloration syntaxique
     */
    f_cCreateEditor(p_sContainerId, p_sInitialCode = '', p_cOptions = {}) {
        const container = document.getElementById(p_sContainerId);
        if (!container) return null;

        // Options par défaut
        const options = {
            placeholder: '',
            tabSize: 4,
            minHeight: '200px',
            ...p_cOptions
        };

        // Créer la structure
        const wrapper = document.createElement('div');
        wrapper.className = 'c-syntax-editor-container';
        wrapper.style.position = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.minHeight = options.minHeight;

        // Textarea invisible pour l'édition
        const textarea = document.createElement('textarea');
        textarea.className = 'c-syntax-editor';
        textarea.style.position = 'absolute';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.minHeight = options.minHeight;
        textarea.style.color = 'transparent';
        textarea.style.caretColor = 'white';
        textarea.style.background = 'transparent';
        textarea.style.resize = 'none';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.padding = '12px';
        textarea.style.margin = '0';
        textarea.style.boxSizing = 'border-box';
        textarea.style.fontFamily = "'Courier New', Consolas, Monaco, monospace";
        textarea.style.fontSize = '13px';
        textarea.style.lineHeight = '1.5';
        textarea.style.tabSize = options.tabSize;
        textarea.value = p_sInitialCode;
        if(options.placeholder) textarea.placeholder = options.placeholder;

        // Div pour l'affichage coloré
        const display = document.createElement('div');
        display.className = 'c-syntax-editor';
        display.style.pointerEvents = 'none';
        display.style.minHeight = options.minHeight;
        display.style.padding = '12px';
        display.style.margin = '0';
        display.style.boxSizing = 'border-box';
        display.style.fontFamily = "'Courier New', Consolas, Monaco, monospace";
        display.style.fontSize = '13px';
        display.style.lineHeight = '1.5';
        display.style.whiteSpace = 'pre';
        display.style.wordWrap = 'break-word';
        display.style.overflowWrap = 'break-word';
        display.innerHTML = this.f_sHighlight(p_sInitialCode);

        // Synchroniser le scroll
        textarea.addEventListener('scroll', () => {
            display.scrollTop = textarea.scrollTop;
            display.scrollLeft = textarea.scrollLeft;
        });

        // Mettre à jour la coloration
        textarea.addEventListener('input', () => {
            display.innerHTML = this.f_sHighlight(textarea.value);
        });

        wrapper.appendChild(display);
        wrapper.appendChild(textarea);
        container.appendChild(wrapper);

        return {
            textarea,
            display,
            getValue: () => textarea.value,
            setValue: (value) => {
                textarea.value = value;
                display.innerHTML = this.f_sHighlight(value);
            }
        };
    }

    /**
     * Méthode statique pour obtenir les langages supportés
     */
    static F_lGetSupportedLanguages() {
        return ['html', 'css', 'javascript', 'json', 'python', 'php'];
    }
}

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
    window.C_SyntaxHighlighter = C_SyntaxHighlighter;
}
