/**
 * API Framework - Gestion des requêtes HTTP et manipulation du DOM
 */
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
        // Utilise le système de popup de l'app si disponible, sinon fallback
        if (window.G_cApp && typeof window.G_cApp.f_vAlert === 'function') {
            window.G_cApp.f_vAlert(p_sMessage);
        } else {
            alert(p_sMessage);
        }
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
