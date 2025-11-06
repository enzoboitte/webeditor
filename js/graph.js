/**
 * GRAPH VISUALIZER - Visualisation des pages et interactions
 * Permet de créer un graphe en arbre montrant les pages et leurs composants
 * avec les liens de navigation entre eux
 */

class C_GraphNode {
    constructor(p_sType, p_sId, p_sLabel, p_iX = 0, p_iY = 0) {
        this.m_sType = p_sType; // 'page' ou 'element'
        this.m_sId = p_sId;
        this.m_sLabel = p_sLabel;
        this.m_iX = p_iX;
        this.m_iY = p_iY;
        this.m_iWidth = 220;
        this.m_iHeight = p_sType === 'page' ? 160 : 40;
        this.m_lElements = []; // Pour les pages, liste de TOUS les éléments
        this.m_lDisplayedElementIds = []; // IDs des éléments à afficher dans le graphe
        this.m_lLinks = []; // Liens vers d'autres pages
        this.m_bDragging = false;
        this.m_iDragOffsetX = 0;
        this.m_iDragOffsetY = 0;
    }

    F_bContainsPoint(p_iX, p_iY) {
        return p_iX >= this.m_iX && p_iX <= this.m_iX + this.m_iWidth &&
               p_iY >= this.m_iY && p_iY <= this.m_iY + this.m_iHeight;
    }

    F_cGetElementAtPoint(p_iX, p_iY) {
        if (this.m_sType !== 'page') return null;
        
        const l_iBodyY = this.m_iY + 62; // Position du body
        const l_iElementsStartY = l_iBodyY + 40; // Offset initial des éléments
        const l_iElementHeight = 30;
        
        for (let i = 0; i < this.m_lDisplayedElementIds.length; i++) {
            const l_sElementId = this.m_lDisplayedElementIds[i];
            const l_cElement = this.m_lElements.find(e => e.id === l_sElementId);
            if (!l_cElement) continue;
            
            const l_iY = l_iElementsStartY + (i * l_iElementHeight);
            if (p_iY >= l_iY - 5 && p_iY <= l_iY + 21 &&
                p_iX >= this.m_iX + 15 && p_iX <= this.m_iX + this.m_iWidth - 15) {
                return { index: i, element: l_cElement, y: l_iY + 8 };
            }
        }
        return null;
    }

    F_cGetHandlePosition(p_sType) {
        const l_iRadius = 9;
        const l_iOffset = l_iRadius + 6;
        if (p_sType === 'incoming') {
            return {
                x: this.m_iX - l_iOffset,
                y: this.m_iY + (this.m_iHeight / 2),
                radius: l_iRadius
            };
        }
        if (p_sType === 'outgoing') {
            return {
                x: this.m_iX + this.m_iWidth + l_iOffset,
                y: this.m_iY + (this.m_iHeight / 2),
                radius: l_iRadius
            };
        }
        return null;
    }

    F_bIsPointOnHandle(p_iX, p_iY, p_sType) {
        const l_cHandle = this.F_cGetHandlePosition(p_sType);
        if (!l_cHandle) return false;
        const l_fDistance = Math.hypot(p_iX - l_cHandle.x, p_iY - l_cHandle.y);
        return l_fDistance <= l_cHandle.radius + 2;
    }

    F_vDraw(p_cCtx, p_bSelected = false, p_bHighlight = false) {
        const l_sColor = this.m_sType === 'page' ? '#0078d4' : '#28a745';
        const l_sHeaderColor = this.m_sType === 'page' ? '#005a9e' : '#218838';
        const l_sBorderRadius = 8;

        // Calculer la hauteur AVANT de dessiner (pour les pages)
        if (this.m_sType === 'page') {
            const l_iDisplayedCount = this.m_lDisplayedElementIds.length;
            const l_iMinHeight = 140; // Agrandi pour plus d'espace
            const l_iElementHeight = 30;
            const l_iHeaderOffset = 102; // Header (36) + ID (20) + badge (28) + marges
            const l_iNeededHeight = l_iHeaderOffset + (l_iDisplayedCount * l_iElementHeight) + 10;
            this.m_iHeight = Math.max(l_iMinHeight, l_iNeededHeight);
        }

        // Ombre portée plus prononcée (encore plus si highlight)
        if (p_bHighlight) {
            p_cCtx.shadowColor = 'rgba(255, 111, 97, 0.6)';
            p_cCtx.shadowBlur = 24;
        } else {
            p_cCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            p_cCtx.shadowBlur = 16;
        }
        p_cCtx.shadowOffsetX = 0;
        p_cCtx.shadowOffsetY = 6;

        // Rectangle principal avec coins arrondis
        p_cCtx.fillStyle = '#252526';
        this.F_vDrawRoundedRect(p_cCtx, this.m_iX, this.m_iY, this.m_iWidth, this.m_iHeight, l_sBorderRadius);
        p_cCtx.fill();

        // Reset shadow pour le reste
        p_cCtx.shadowColor = 'transparent';
        p_cCtx.shadowBlur = 0;
        p_cCtx.shadowOffsetX = 0;
        p_cCtx.shadowOffsetY = 0;

        // Header avec gradient et coins arrondis en haut
        p_cCtx.save();
        this.F_vDrawRoundedRect(p_cCtx, this.m_iX, this.m_iY, this.m_iWidth, 36, l_sBorderRadius, true, false);
        p_cCtx.clip();
        const gradient = p_cCtx.createLinearGradient(this.m_iX, this.m_iY, this.m_iX, this.m_iY + 36);
        gradient.addColorStop(0, l_sColor);
        gradient.addColorStop(1, l_sHeaderColor);
        p_cCtx.fillStyle = gradient;
        p_cCtx.fillRect(this.m_iX, this.m_iY, this.m_iWidth, 36);
        p_cCtx.restore();

        // Icône de page
        p_cCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        p_cCtx.font = '14px "Font Awesome 6 Free"';
        p_cCtx.fillText('📄', this.m_iX + 10, this.m_iY + 24);

        // Titre
        p_cCtx.fillStyle = '#fff';
        p_cCtx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        p_cCtx.textAlign = 'left';
        p_cCtx.fillText(this.m_sLabel, this.m_iX + 32, this.m_iY + 23);
        
        // Bordure avec glow si sélectionné (APRÈS le header pour être visible)
        if (p_bSelected) {
            p_cCtx.shadowColor = 'rgba(0, 255, 0, 0.5)';
            p_cCtx.shadowBlur = 20;
            p_cCtx.strokeStyle = '#00ff00';
            p_cCtx.lineWidth = 3;
        } else {
            p_cCtx.strokeStyle = l_sColor;
            p_cCtx.lineWidth = 2;
        }
        this.F_vDrawRoundedRect(p_cCtx, this.m_iX, this.m_iY, this.m_iWidth, this.m_iHeight, l_sBorderRadius);
        p_cCtx.stroke();
        
        // Reset shadow
        p_cCtx.shadowColor = 'transparent';
        p_cCtx.shadowBlur = 0;
        
        // ID de la page (en dessous du header, pas dedans)
        if (this.m_sType === 'page') {
            p_cCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            p_cCtx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            p_cCtx.fillText(`ID: ${this.m_sId}`, this.m_iX + 12, this.m_iY + 56);
        }

        if (this.m_sType === 'page') {
            const l_iBodyX = this.m_iX + 10;
            const l_iBodyY = this.m_iY + 62; // Ajusté pour laisser place à l'ID (36 header + 6 gap + 20 ID)
            const l_iBodyWidth = this.m_iWidth - 20;
            const l_iBodyHeight = this.m_iHeight - 74; // Rétabli l'espacement d'origine

            // Fond du body avec bordure subtile
            p_cCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            this.F_vDrawRoundedRect(p_cCtx, l_iBodyX, l_iBodyY, l_iBodyWidth, l_iBodyHeight, 4);
            p_cCtx.fill();
            p_cCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            p_cCtx.lineWidth = 1;
            this.F_vDrawRoundedRect(p_cCtx, l_iBodyX, l_iBodyY, l_iBodyWidth, l_iBodyHeight, 4);
            p_cCtx.stroke();

            // Badge du nombre de composants
            const l_sBadgeText = `${this.m_lElements.length}`;
            p_cCtx.fillStyle = this.m_lElements.length > 0 ? 'rgba(0, 120, 212, 0.3)' : 'rgba(128, 128, 128, 0.3)';
            p_cCtx.fillRect(l_iBodyX + 8, l_iBodyY + 10, 30, 18);
            p_cCtx.fillStyle = this.m_lElements.length > 0 ? '#0078d4' : '#888';
            p_cCtx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            p_cCtx.textAlign = 'center';
            p_cCtx.fillText(l_sBadgeText, l_iBodyX + 23, l_iBodyY + 22);

            p_cCtx.textAlign = 'left';
            p_cCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            p_cCtx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            p_cCtx.fillText('composants', l_iBodyX + 44, l_iBodyY + 22);

            // Afficher les éléments sélectionnés
            const l_iDisplayedCount = this.m_lDisplayedElementIds.length;
            p_cCtx.fillStyle = '#ffffff';
            p_cCtx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            
            if (l_iDisplayedCount === 0) {
                p_cCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                p_cCtx.fillText('Aucun élément affiché', l_iBodyX + 8, l_iBodyY + 46);
            } else {
                const l_iElementHeight = 30;
                let l_iCurrentY = l_iBodyY + 40;
                this.m_lDisplayedElementIds.forEach((l_sElementId, l_iIndex) => {
                    const l_cElement = this.m_lElements.find(e => e.id === l_sElementId);
                    if (!l_cElement) return;
                    
                    // Fond de l'élément
                    p_cCtx.fillStyle = 'rgba(0, 120, 212, 0.15)';
                    p_cCtx.fillRect(l_iBodyX + 5, l_iCurrentY - 5, l_iBodyWidth - 10, 26);
                    
                    // Bordure
                    p_cCtx.strokeStyle = 'rgba(0, 120, 212, 0.4)';
                    p_cCtx.lineWidth = 1;
                    p_cCtx.strokeRect(l_iBodyX + 5, l_iCurrentY - 5, l_iBodyWidth - 10, 26);
                    
                    // Icône et label
                    p_cCtx.fillStyle = l_cElement.hasLink ? '#28a745' : '#fff';
                    p_cCtx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    const l_sIcon = l_cElement.hasLink ? '🔗' : '📦';
                    p_cCtx.fillText(l_sIcon, l_iBodyX + 10, l_iCurrentY + 10);
                    
                    // Label sur la première ligne
                    const l_sLabel = l_cElement.label.length > 18 ? l_cElement.label.substring(0, 18) + '...' : l_cElement.label;
                    p_cCtx.fillStyle = '#fff';
                    p_cCtx.fillText(l_sLabel, l_iBodyX + 28, l_iCurrentY + 6);
                    
                    // ID sur la deuxième ligne (plus petit et plus discret)
                    p_cCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    p_cCtx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    p_cCtx.fillText(`ID: ${l_sElementId}`, l_iBodyX + 28, l_iCurrentY + 17);
                    
                    // Dessiner le point vert à côté de l'élément
                    const l_iRadius = 6;
                    const l_iHandleX = this.m_iX + this.m_iWidth - 5;
                    const l_iHandleY = l_iCurrentY + 8;
                    
                    p_cCtx.fillStyle = l_cElement.hasLink ? '#28a745' : '#555';
                    p_cCtx.beginPath();
                    p_cCtx.arc(l_iHandleX, l_iHandleY, l_iRadius, 0, Math.PI * 2);
                    p_cCtx.fill();
                    
                    p_cCtx.strokeStyle = l_cElement.hasLink ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
                    p_cCtx.lineWidth = 2;
                    p_cCtx.stroke();
                    
                    l_iCurrentY += l_iElementHeight;
                });
            }
        }

        // Handles avec style amélioré
        const l_cIncomingHandle = this.F_cGetHandlePosition('incoming');
        if (this.m_sType === 'page' && l_cIncomingHandle) {
            // Ombre du handle (plus forte si highlight)
            if (p_bHighlight) {
                p_cCtx.shadowColor = 'rgba(255, 111, 97, 0.8)';
                p_cCtx.shadowBlur = 16;
            } else {
                p_cCtx.shadowColor = 'rgba(255, 111, 97, 0.4)';
                p_cCtx.shadowBlur = 8;
            }
            
            // Handle plus grand si highlight
            const l_iHandleRadius = p_bHighlight ? l_cIncomingHandle.radius * 1.3 : l_cIncomingHandle.radius;
            
            p_cCtx.fillStyle = p_bHighlight ? '#ff8a80' : '#ff6f61';
            p_cCtx.beginPath();
            p_cCtx.arc(l_cIncomingHandle.x, l_cIncomingHandle.y, l_iHandleRadius, 0, Math.PI * 2);
            p_cCtx.fill();
            
            p_cCtx.shadowColor = 'transparent';
            p_cCtx.shadowBlur = 0;
            p_cCtx.lineWidth = p_bHighlight ? 3 : 2.5;
            p_cCtx.strokeStyle = p_bHighlight ? '#fff' : 'rgba(255, 255, 255, 0.8)';
            p_cCtx.stroke();
            
            // Centre du handle
            p_cCtx.fillStyle = p_bHighlight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)';
            p_cCtx.beginPath();
            p_cCtx.arc(l_cIncomingHandle.x, l_cIncomingHandle.y, 3, 0, Math.PI * 2);
            p_cCtx.fill();
        }

        // Ne plus dessiner le handle de sortie global (point vert au centre de la page)
        // Les points verts individuels sont dessinés pour chaque élément affiché
    }

    F_vDrawRoundedRect(p_cCtx, p_iX, p_iY, p_iWidth, p_iHeight, p_iRadius, p_bTopOnly = false, p_bBottomOnly = false) {
        p_cCtx.beginPath();
        if (p_bTopOnly) {
            p_cCtx.moveTo(p_iX + p_iRadius, p_iY);
            p_cCtx.lineTo(p_iX + p_iWidth - p_iRadius, p_iY);
            p_cCtx.quadraticCurveTo(p_iX + p_iWidth, p_iY, p_iX + p_iWidth, p_iY + p_iRadius);
            p_cCtx.lineTo(p_iX + p_iWidth, p_iY + p_iHeight);
            p_cCtx.lineTo(p_iX, p_iY + p_iHeight);
            p_cCtx.lineTo(p_iX, p_iY + p_iRadius);
            p_cCtx.quadraticCurveTo(p_iX, p_iY, p_iX + p_iRadius, p_iY);
        } else if (p_bBottomOnly) {
            p_cCtx.moveTo(p_iX, p_iY);
            p_cCtx.lineTo(p_iX + p_iWidth, p_iY);
            p_cCtx.lineTo(p_iX + p_iWidth, p_iY + p_iHeight - p_iRadius);
            p_cCtx.quadraticCurveTo(p_iX + p_iWidth, p_iY + p_iHeight, p_iX + p_iWidth - p_iRadius, p_iY + p_iHeight);
            p_cCtx.lineTo(p_iX + p_iRadius, p_iY + p_iHeight);
            p_cCtx.quadraticCurveTo(p_iX, p_iY + p_iHeight, p_iX, p_iY + p_iHeight - p_iRadius);
            p_cCtx.lineTo(p_iX, p_iY);
        } else {
            p_cCtx.moveTo(p_iX + p_iRadius, p_iY);
            p_cCtx.lineTo(p_iX + p_iWidth - p_iRadius, p_iY);
            p_cCtx.quadraticCurveTo(p_iX + p_iWidth, p_iY, p_iX + p_iWidth, p_iY + p_iRadius);
            p_cCtx.lineTo(p_iX + p_iWidth, p_iY + p_iHeight - p_iRadius);
            p_cCtx.quadraticCurveTo(p_iX + p_iWidth, p_iY + p_iHeight, p_iX + p_iWidth - p_iRadius, p_iY + p_iHeight);
            p_cCtx.lineTo(p_iX + p_iRadius, p_iY + p_iHeight);
            p_cCtx.quadraticCurveTo(p_iX, p_iY + p_iHeight, p_iX, p_iY + p_iHeight - p_iRadius);
            p_cCtx.lineTo(p_iX, p_iY + p_iRadius);
            p_cCtx.quadraticCurveTo(p_iX, p_iY, p_iX + p_iRadius, p_iY);
        }
        p_cCtx.closePath();
    }
}

class C_GraphLink {
    constructor(p_cFromNode, p_iFromElementIndex, p_cToNode, p_sAction = 'click') {
        this.m_cFromNode = p_cFromNode;
        this.m_iFromElementIndex = p_iFromElementIndex; // Index de l'élément dans la page
        this.m_cToNode = p_cToNode;
        this.m_sAction = p_sAction; // 'click', 'dblclick', 'load'
        
        // Pour la détection de clic
        this.m_iLabelX = 0;
        this.m_iLabelY = 0;
        this.m_iLabelWidth = 60;
        this.m_iLabelHeight = 20;
        this.m_lPathPoints = []; // Points de la courbe pour détecter les clics
    }
    
    // Vérifier si un point est sur le label ou la ligne
    F_bContainsPoint(p_iX, p_iY) {
        // Vérifier le label
        if (p_iX >= this.m_iLabelX - this.m_iLabelWidth/2 && 
            p_iX <= this.m_iLabelX + this.m_iLabelWidth/2 &&
            p_iY >= this.m_iLabelY - this.m_iLabelHeight/2 && 
            p_iY <= this.m_iLabelY + this.m_iLabelHeight/2) {
            return true;
        }
        
        // Vérifier la proximité avec la ligne (plus tolérant)
        for (let i = 0; i < this.m_lPathPoints.length; i++) {
            const l_cPoint = this.m_lPathPoints[i];
            const l_fDistance = Math.hypot(p_iX - l_cPoint.x, p_iY - l_cPoint.y);
            if (l_fDistance < 10) { // 10px de tolérance
                return true;
            }
        }
        
        return false;
    }

    F_vDraw(p_cCtx) {
    // Point de départ : utiliser la position du handle vert (outgoing)
    // Calculer la position Y de l'élément (doit correspondre à l'affichage dans F_vDraw du node)
    const l_iBodyY = this.m_cFromNode.m_iY + 102; // Body (62) + offset initial des éléments (40)
        const l_iElementHeight = 30;
        const l_iElementY = l_iBodyY + (this.m_iFromElementIndex * l_iElementHeight) + 8;
        
        // Position du handle de sortie (point vert) pour cet élément
        const l_iRadius = 6;
        const l_iFromX = this.m_cFromNode.m_iX + this.m_cFromNode.m_iWidth - 5;
        const l_iFromY = l_iElementY;
        
        // Point d'arrivée : handle d'entrée (point rouge) de la page cible
        const l_cIncomingHandle = this.m_cToNode.F_cGetHandlePosition('incoming');
        const l_iToX = l_cIncomingHandle.x;
        const l_iToY = l_cIncomingHandle.y;

        // Couleur selon l'action - thème de l'app
        let l_sColor = '#888';
        if (this.m_sAction === 'click') l_sColor = '#0078d4';
        else if (this.m_sAction === 'dblclick') l_sColor = '#ffc107';
        else if (this.m_sAction === 'load') l_sColor = '#9c27b0';

        // Courbe de Bézier
        p_cCtx.strokeStyle = l_sColor;
        p_cCtx.lineWidth = 3;
        p_cCtx.setLineDash([8, 4]);
        
        p_cCtx.beginPath();
        p_cCtx.moveTo(l_iFromX, l_iFromY);
        
        const l_iControlPointOffset = Math.abs(l_iToX - l_iFromX) / 2;
        p_cCtx.bezierCurveTo(
            l_iFromX + l_iControlPointOffset, l_iFromY,
            l_iToX - l_iControlPointOffset, l_iToY,
            l_iToX, l_iToY
        );
        p_cCtx.stroke();
        p_cCtx.setLineDash([]);
        
        // Stocker des points le long de la courbe pour la détection de clic
        this.m_lPathPoints = [];
        for (let t = 0; t <= 1; t += 0.05) {
            const x = Math.pow(1-t, 3) * l_iFromX + 
                      3 * Math.pow(1-t, 2) * t * (l_iFromX + l_iControlPointOffset) +
                      3 * (1-t) * Math.pow(t, 2) * (l_iToX - l_iControlPointOffset) +
                      Math.pow(t, 3) * l_iToX;
            const y = Math.pow(1-t, 3) * l_iFromY + 
                      3 * Math.pow(1-t, 2) * t * l_iFromY +
                      3 * (1-t) * Math.pow(t, 2) * l_iToY +
                      Math.pow(t, 3) * l_iToY;
            this.m_lPathPoints.push({x, y});
        }

        // Flèche à l'arrivée
        const l_iArrowSize = 12;
        p_cCtx.fillStyle = l_sColor;
        p_cCtx.beginPath();
        p_cCtx.moveTo(l_iToX, l_iToY);
        p_cCtx.lineTo(l_iToX - l_iArrowSize, l_iToY - l_iArrowSize / 2);
        p_cCtx.lineTo(l_iToX - l_iArrowSize, l_iToY + l_iArrowSize / 2);
        p_cCtx.closePath();
        p_cCtx.fill();

        // Label de l'action
        const l_iLabelX = (l_iFromX + l_iToX) / 2;
        const l_iLabelY = (l_iFromY + l_iToY) / 2 - 5;
        
        // Stocker les coordonnées du label pour la détection de clic
        this.m_iLabelX = l_iLabelX;
        this.m_iLabelY = l_iLabelY;
        
        p_cCtx.fillStyle = '#2d2d2d';
        p_cCtx.fillRect(l_iLabelX - 30, l_iLabelY - 10, 60, 20);
        p_cCtx.strokeStyle = l_sColor;
        p_cCtx.lineWidth = 1;
        p_cCtx.strokeRect(l_iLabelX - 30, l_iLabelY - 10, 60, 20);
        
        p_cCtx.fillStyle = '#fff';
        p_cCtx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        p_cCtx.textAlign = 'center';
        p_cCtx.fillText(this.m_sAction, l_iLabelX, l_iLabelY + 5);
    }
}

class C_GraphVisualizer {
    constructor() {
        this.m_lNodes = [];
        this.m_lLinks = [];
        this.m_cCanvas = null;
        this.m_cCtx = null;
        this.m_cSelectedNode = null;
        this.m_cSelectedElement = null;
        this.m_cDraggingNode = null;
        this.m_bPanning = false;
        this.m_iOffsetX = 0;
        this.m_iOffsetY = 0;
        this.m_iPanStartX = 0;
        this.m_iPanStartY = 0;
        this.m_fScale = 1;
        this.m_bComponentSelectBound = false;
        
        // Système de création de lien par drag
        this.m_cDraggingFromNode = null;
        this.m_iDraggingFromElementIndex = -1;
        this.m_iDragLinkMouseX = 0;
        this.m_iDragLinkMouseY = 0;
        this.m_bDraggingLink = false;
        
        // Stockage temporaire pour la création de liens
        this.m_iTempElementIndex = -1;
        this.m_cTempTargetNode = null;
    }

    F_vInit(p_sCanvasId) {
        this.m_cCanvas = document.getElementById(p_sCanvasId);
        this.m_cCtx = this.m_cCanvas.getContext('2d');
        
        // Redimensionner le canvas
        this.F_vResizeCanvas();
        window.addEventListener('resize', () => this.F_vResizeCanvas());

        // Events
        this.m_cCanvas.addEventListener('mousedown', (e) => this.F_vOnMouseDown(e));
        this.m_cCanvas.addEventListener('mousemove', (e) => this.F_vOnMouseMove(e));
        this.m_cCanvas.addEventListener('mouseup', (e) => this.F_vOnMouseUp(e));
        this.m_cCanvas.addEventListener('wheel', (e) => this.F_vOnWheel(e));
        this.m_cCanvas.addEventListener('dblclick', (e) => this.F_vOnDoubleClick(e));

        const l_cComponentSelect = document.getElementById('G_sGraphComponentSelect');
        if (l_cComponentSelect && !this.m_bComponentSelectBound) {
            l_cComponentSelect.addEventListener('change', (p_oEvent) => this.F_vHandleComponentSelectChange(p_oEvent));
            this.m_bComponentSelectBound = true;
        }

        // Générer les nodes depuis les pages
        this.F_vGenerateNodesFromPages();
        
        // Dessiner
        this.F_vDraw();
    }

    F_vResizeCanvas() {
        const l_cContainer = this.m_cCanvas.parentElement;
        this.m_cCanvas.width = l_cContainer.clientWidth;
        this.m_cCanvas.height = l_cContainer.clientHeight;
        this.F_vDraw();
    }

    F_vGenerateNodesFromPages() {
        const l_oPreviousDisplayedElements = {};
        if (this.m_lNodes && this.m_lNodes.length > 0) {
            this.m_lNodes.forEach(l_cNode => {
                if (l_cNode.m_lDisplayedElementIds && l_cNode.m_lDisplayedElementIds.length > 0) {
                    l_oPreviousDisplayedElements[l_cNode.m_sId] = [...l_cNode.m_lDisplayedElementIds];
                }
            });
        }
        const l_sPreviouslySelectedNodeId = this.m_cSelectedNode ? this.m_cSelectedNode.m_sId : null;

        this.m_lNodes = [];
        this.m_lLinks = [];
        
        if (!window.G_cApp || !window.G_cApp.G_lPages || window.G_cApp.G_lPages.length === 0) {
            console.log('Aucune page à afficher');
            this.m_cSelectedNode = null;
            this.m_cSelectedElement = null;
            this.F_vUpdateComponentDropdown();
            return;
        }

        console.log('Génération des nodes pour', window.G_cApp.G_lPages.length, 'pages');

        const l_iSpacingX = 300;
        const l_iSpacingY = 250;
        const l_iColumns = Math.ceil(Math.sqrt(window.G_cApp.G_lPages.length));
        const l_lDeferredLinks = [];

        window.G_cApp.G_lPages.forEach((l_cPage, l_iIndex) => {
            const l_iCol = l_iIndex % l_iColumns;
            const l_iRow = Math.floor(l_iIndex / l_iColumns);
            const l_iX = 50 + (l_iCol * l_iSpacingX);
            const l_iY = 50 + (l_iRow * l_iSpacingY);

            const l_cNode = new C_GraphNode('page', l_cPage.id, l_cPage.title || l_cPage.name || 'Page sans nom', l_iX, l_iY);
            console.log('Node créé:', l_cNode.m_sLabel, 'ID:', l_cPage.id, 'à position', l_iX, l_iY);

            // Fonction récursive pour collecter tous les éléments (y compris les enfants)
            const f_vCollectElementsRecursive = (p_lElements) => {
                if (!p_lElements || !Array.isArray(p_lElements)) return;
                
                p_lElements.forEach(l_cElement => {
                    if (l_cElement && l_cElement.id) {
                        const hasLinks = l_cElement.m_cNavigationLinks && l_cElement.m_cNavigationLinks.length > 0;
                        const l_sElementLabel = l_cElement.name || l_cElement.label || l_cElement.type || 'Composant';

                        l_cNode.m_lElements.push({
                            id: l_cElement.id,
                            label: l_sElementLabel,
                            hasLink: !!hasLinks
                        });

                        if (hasLinks) {
                            l_cElement.m_cNavigationLinks.forEach(l_cLink => {
                                if (!l_cLink || !l_cLink.targetPage) return;
                                l_lDeferredLinks.push({
                                    sourcePageId: l_cPage.id,
                                    sourceElementId: l_cElement.id,
                                    targetPageId: l_cLink.targetPage,
                                    action: l_cLink.action || 'click'
                                });
                            });
                        }
                        
                        // Récursivement collecter les enfants
                        if (l_cElement.children && l_cElement.children.length > 0) {
                            f_vCollectElementsRecursive(l_cElement.children);
                        }
                    }
                });
            };

            if (l_cPage.elements && l_cPage.elements.length > 0) {
                f_vCollectElementsRecursive(l_cPage.elements);

                const l_aPreviousDisplayed = l_oPreviousDisplayedElements[l_cPage.id];
                if (l_aPreviousDisplayed && l_aPreviousDisplayed.length > 0) {
                    // Restaurer les éléments affichés précédemment
                    l_cNode.m_lDisplayedElementIds = l_aPreviousDisplayed.filter(id => 
                        l_cNode.m_lElements.some(e => e.id === id)
                    );
                } else if (l_cNode.m_lElements.length > 0) {
                    // Par défaut, afficher les éléments qui ont des liens
                    const l_aLinkedElements = l_cNode.m_lElements.filter(e => e.hasLink).map(e => e.id);
                    l_cNode.m_lDisplayedElementIds = l_aLinkedElements.length > 0 ? l_aLinkedElements : [l_cNode.m_lElements[0].id];
                }
            }

            this.m_lNodes.push(l_cNode);
            console.log('Node ajouté au tableau, total:', this.m_lNodes.length);
        });

        console.log('=== Tous les nodes créés:', this.m_lNodes.length, '===');
        this.m_lNodes.forEach((n, i) => console.log(`  [${i}] ${n.m_sLabel} (${n.m_sId})`));

        l_lDeferredLinks.forEach(l_cDeferred => {
            const l_cSourceNode = this.m_lNodes.find(l_cNode => l_cNode.m_sId === l_cDeferred.sourcePageId);
            const l_cTargetNode = this.m_lNodes.find(l_cNode => l_cNode.m_sId === l_cDeferred.targetPageId);
            if (!l_cSourceNode || !l_cTargetNode) return;

            const l_iElementIndex = l_cSourceNode.m_lDisplayedElementIds.indexOf(l_cDeferred.sourceElementId);
            if (l_iElementIndex === -1) return;

            const l_cGraphLink = new C_GraphLink(l_cSourceNode, l_iElementIndex, l_cTargetNode, l_cDeferred.action);
            this.m_lLinks.push(l_cGraphLink);
        });

        const l_cRestoredNode = this.m_lNodes.find(l_cNode => l_cNode.m_sId === l_sPreviouslySelectedNodeId);
        this.m_cSelectedNode = l_cRestoredNode || (this.m_lNodes.length > 0 ? this.m_lNodes[0] : null);
        this.m_cSelectedElement = null;

        this.F_vUpdateComponentDropdown();

        console.log('Total nodes créés:', this.m_lNodes.length);
    }

    F_vUpdateComponentDropdown() {
        const l_cSelect = document.getElementById('G_sGraphComponentSelect');
        if (!l_cSelect) {
            return;
        }

        while (l_cSelect.firstChild) {
            l_cSelect.removeChild(l_cSelect.firstChild);
        }

        if (!this.m_cSelectedNode || this.m_cSelectedNode.m_sType !== 'page') {
            l_cSelect.disabled = true;
            const l_cOption = document.createElement('option');
            l_cOption.value = '';
            l_cOption.textContent = 'Sélectionnez une page';
            l_cSelect.appendChild(l_cOption);
            l_cSelect.value = '';
            return;
        }

        const l_cNode = this.m_cSelectedNode;
        const l_lElements = Array.isArray(l_cNode.m_lElements) ? l_cNode.m_lElements : [];

        if (l_lElements.length === 0) {
            l_cSelect.disabled = true;
            const l_cEmptyOption = document.createElement('option');
            l_cEmptyOption.value = '';
            l_cEmptyOption.textContent = 'Aucun composant sur cette page';
            l_cSelect.appendChild(l_cEmptyOption);
            l_cSelect.value = '';
            return;
        }

        l_cSelect.disabled = false;

        // Option par défaut
        const l_cDefaultOption = document.createElement('option');
        l_cDefaultOption.value = '';
        l_cDefaultOption.textContent = `+ Ajouter un élément (${l_cNode.m_lDisplayedElementIds.length}/${l_lElements.length})`;
        l_cSelect.appendChild(l_cDefaultOption);

        // Liste des éléments disponibles
        l_lElements.forEach(l_cElement => {
            const l_bIsDisplayed = l_cNode.m_lDisplayedElementIds.includes(l_cElement.id);
            const l_cOption = document.createElement('option');
            l_cOption.value = l_cElement.id;
            l_cOption.textContent = `${l_bIsDisplayed ? '✓ ' : ''}${l_cElement.label}${l_cElement.hasLink ? ' (lié)' : ''}`;
            l_cSelect.appendChild(l_cOption);
        });

        l_cSelect.value = '';
    }

    F_vHandleComponentSelectChange(p_oEvent) {
        if (!this.m_cSelectedNode) {
            return;
        }

        const l_sSelectedId = p_oEvent && p_oEvent.target ? p_oEvent.target.value : '';
        if (!l_sSelectedId) {
            // Revenir à l'option par défaut
            p_oEvent.target.value = '';
            return;
        }
        
        const l_lElements = Array.isArray(this.m_cSelectedNode.m_lElements) ? this.m_cSelectedNode.m_lElements : [];
        const l_bExists = l_lElements.some(l_cElement => l_cElement.id === l_sSelectedId);
        
        if (!l_bExists) return;

        // Toggle : ajouter ou retirer l'élément de la liste affichée
        const l_iIndex = this.m_cSelectedNode.m_lDisplayedElementIds.indexOf(l_sSelectedId);
        if (l_iIndex >= 0) {
            // Retirer l'élément
            this.m_cSelectedNode.m_lDisplayedElementIds.splice(l_iIndex, 1);
        } else {
            // Ajouter l'élément
            this.m_cSelectedNode.m_lDisplayedElementIds.push(l_sSelectedId);
        }
        
        this.F_vUpdateComponentDropdown();
        this.F_vDraw();
    }

    F_vOnMouseDown(p_cEvent) {
        const l_cRect = this.m_cCanvas.getBoundingClientRect();
        const l_iX = (p_cEvent.clientX - l_cRect.left - this.m_iOffsetX) / this.m_fScale;
        const l_iY = (p_cEvent.clientY - l_cRect.top - this.m_iOffsetY) / this.m_fScale;

        // Vérifier d'abord les handles de sortie (points verts des éléments)
        for (let i = this.m_lNodes.length - 1; i >= 0; i--) {
            const l_cNode = this.m_lNodes[i];
            
            // Vérifier chaque élément affiché pour ses points verts
            if (l_cNode.m_sType === 'page' && l_cNode.m_lDisplayedElementIds.length > 0) {
                const l_iBodyY = l_cNode.m_iY + 102; // Body (62) + offset initial des éléments (40)
                const l_iElementHeight = 30;
                
                for (let j = 0; j < l_cNode.m_lDisplayedElementIds.length; j++) {
                    const l_sElementId = l_cNode.m_lDisplayedElementIds[j];
                    const l_iCurrentY = l_iBodyY + (j * l_iElementHeight);
                    
                    // Position du point vert pour cet élément
                    const l_iRadius = 6;
                    const l_iHandleX = l_cNode.m_iX + l_cNode.m_iWidth - 5;
                    const l_iHandleY = l_iCurrentY + 8;
                    
                    // Vérifier si on clique sur ce point vert
                    const l_fDistance = Math.hypot(l_iX - l_iHandleX, l_iY - l_iHandleY);
                    if (l_fDistance <= l_iRadius + 2) {
                        // Démarrer le drag de création de lien
                        this.m_bDraggingLink = true;
                        this.m_cDraggingFromNode = l_cNode;
                        this.m_iDraggingFromElementIndex = j;
                        this.m_iDragLinkMouseX = l_iX;
                        this.m_iDragLinkMouseY = l_iY;
                        console.log('Début du drag de lien depuis', l_cNode.m_sLabel, 'élément index', j, 'id:', l_sElementId);
                        this.F_vDraw();
                        return;
                    }
                }
            }
            
            // Vérifier le handle d'entrée (information seulement)
            if (l_cNode.F_bIsPointOnHandle(l_iX, l_iY, 'incoming')) {
                console.log('Clic sur handle incoming de', l_cNode.m_sLabel);
                return;
            }
        }

        // Vérifier si on clique sur un node (après les handles)
        for (let i = this.m_lNodes.length - 1; i >= 0; i--) {
            const l_cNode = this.m_lNodes[i];
            if (l_cNode.F_bContainsPoint(l_iX, l_iY)) {
                if (this.m_cSelectedNode !== l_cNode) {
                    this.m_cSelectedNode = l_cNode;
                    this.F_vUpdateComponentDropdown();
                }
                this.m_cSelectedElement = null;
                
                // Vérifier si c'est un élément
                const l_cElement = l_cNode.F_cGetElementAtPoint(l_iX, l_iY);
                if (l_cElement && p_cEvent.shiftKey) {
                    // Mode sélection d'élément pour créer un lien
                    this.m_cSelectedNode = l_cNode;
                    this.m_cSelectedElement = l_cElement;
                    this.F_vShowLinkDialog(l_cNode, l_cElement);
                    return;
                }
                
                // Mode déplacement du node
                this.m_cDraggingNode = l_cNode;
                this.m_cDraggingNode.m_bDragging = true;
                this.m_cDraggingNode.m_iDragOffsetX = l_iX - l_cNode.m_iX;
                this.m_cDraggingNode.m_iDragOffsetY = l_iY - l_cNode.m_iY;
                this.F_vDraw();
                return;
            }
        }

        // Mode pan
        this.m_bPanning = true;
        this.m_iPanStartX = p_cEvent.clientX - this.m_iOffsetX;
        this.m_iPanStartY = p_cEvent.clientY - this.m_iOffsetY;
    }

    F_vOnMouseMove(p_cEvent) {
        const l_cRect = this.m_cCanvas.getBoundingClientRect();
        const l_iX = (p_cEvent.clientX - l_cRect.left - this.m_iOffsetX) / this.m_fScale;
        const l_iY = (p_cEvent.clientY - l_cRect.top - this.m_iOffsetY) / this.m_fScale;

        if (this.m_bDraggingLink) {
            // Mise à jour de la position du curseur pour la ligne temporaire
            let l_iTargetX = l_iX;
            let l_iTargetY = l_iY;
            let l_bSnapped = false;
            
            // Vérifier la proximité avec les handles d'entrée (snap magnétique)
            const l_iSnapDistance = 40; // Distance de snap en pixels
            
            for (let i = 0; i < this.m_lNodes.length; i++) {
                const l_cNode = this.m_lNodes[i];
                
                // Ne pas snapper sur soi-même
                if (l_cNode === this.m_cDraggingFromNode) {
                    continue;
                }
                
                // Vérifier la distance au handle d'entrée
                const l_cHandle = l_cNode.F_cGetHandlePosition('incoming');
                if (l_cHandle) {
                    const l_fDistance = Math.hypot(l_iX - l_cHandle.x, l_iY - l_cHandle.y);
                    
                    if (l_fDistance < l_iSnapDistance) {
                        // Snapper sur le handle
                        l_iTargetX = l_cHandle.x;
                        l_iTargetY = l_cHandle.y;
                        l_bSnapped = true;
                        this.m_cSnapTargetNode = l_cNode;
                        break;
                    }
                }
            }
            
            if (!l_bSnapped) {
                this.m_cSnapTargetNode = null;
            }
            
            this.m_iDragLinkMouseX = l_iTargetX;
            this.m_iDragLinkMouseY = l_iTargetY;
            this.F_vDraw();
            
            // Continuer l'animation si on est snappé
            if (l_bSnapped && !this.m_iAnimationFrame) {
                this.m_iAnimationFrame = requestAnimationFrame(() => this.F_vAnimateSnap());
            }
        } else if (this.m_cDraggingNode) {
            this.m_cDraggingNode.m_iX = l_iX - this.m_cDraggingNode.m_iDragOffsetX;
            this.m_cDraggingNode.m_iY = l_iY - this.m_cDraggingNode.m_iDragOffsetY;
            this.F_vDraw();
        } else if (this.m_bPanning) {
            this.m_iOffsetX = p_cEvent.clientX - this.m_iPanStartX;
            this.m_iOffsetY = p_cEvent.clientY - this.m_iPanStartY;
            this.F_vDraw();
        }
    }

    F_vOnMouseUp(p_cEvent) {
        const l_cRect = this.m_cCanvas.getBoundingClientRect();
        const l_iX = (p_cEvent.clientX - l_cRect.left - this.m_iOffsetX) / this.m_fScale;
        const l_iY = (p_cEvent.clientY - l_cRect.top - this.m_iOffsetY) / this.m_fScale;

        if (this.m_bDraggingLink) {
            // Stopper l'animation de snap
            if (this.m_iAnimationFrame) {
                cancelAnimationFrame(this.m_iAnimationFrame);
                this.m_iAnimationFrame = null;
            }
            
            // Utiliser le node snappé si disponible, sinon vérifier manuellement
            let l_cTargetNode = this.m_cSnapTargetNode;
            
            if (!l_cTargetNode) {
                for (let i = this.m_lNodes.length - 1; i >= 0; i--) {
                    const l_cNode = this.m_lNodes[i];
                    
                    // Ne pas créer un lien vers soi-même
                    if (l_cNode === this.m_cDraggingFromNode) {
                        continue;
                    }
                    
                    // Vérifier si on est sur le handle d'entrée
                    if (l_cNode.F_bIsPointOnHandle(l_iX, l_iY, 'incoming')) {
                        l_cTargetNode = l_cNode;
                        break;
                    }
                }
            }
            
            if (l_cTargetNode) {
                // Afficher la dialog pour choisir l'action
                this.F_vShowLinkDialog(this.m_cDraggingFromNode, null, l_cTargetNode);
            }
            
            // Réinitialiser l'état de drag
            this.m_bDraggingLink = false;
            this.m_cDraggingFromNode = null;
            this.m_iDraggingFromElementIndex = -1;
            this.m_cSnapTargetNode = null;
            this.F_vDraw();
        }
        
        if (this.m_cDraggingNode) {
            this.m_cDraggingNode.m_bDragging = false;
            this.m_cDraggingNode = null;
        }
        this.m_bPanning = false;
    }

    F_vOnWheel(p_cEvent) {
        p_cEvent.preventDefault();
        const l_fDelta = p_cEvent.deltaY > 0 ? 0.9 : 1.1;
        this.m_fScale = Math.max(0.1, Math.min(3, this.m_fScale * l_fDelta));
        this.F_vDraw();
    }
    
    F_vOnDoubleClick(p_cEvent) {
        const l_cRect = this.m_cCanvas.getBoundingClientRect();
        const l_iX = (p_cEvent.clientX - l_cRect.left - this.m_iOffsetX) / this.m_fScale;
        const l_iY = (p_cEvent.clientY - l_cRect.top - this.m_iOffsetY) / this.m_fScale;
        
        // Vérifier si on a double-cliqué sur un lien
        for (let l_cLink of this.m_lLinks) {
            if (l_cLink.F_bContainsPoint(l_iX, l_iY)) {
                // Récupérer l'élément source
                const l_sElementId = l_cLink.m_cFromNode.m_lDisplayedElementIds[l_cLink.m_iFromElementIndex];
                
                // Stocker les informations pour la modification
                this.m_cSelectedNode = l_cLink.m_cFromNode;
                this.m_iTempElementIndex = l_cLink.m_iFromElementIndex;
                this.m_cTempTargetNode = l_cLink.m_cToNode;
                this.m_sEditingLinkAction = l_cLink.m_sAction; // Action actuelle
                
                // Afficher le dialogue de modification
                this.F_vShowEditLinkDialog(l_cLink);
                return;
            }
        }
        
        // Vérifier si on a double-cliqué sur un handle vert (élément)
        for (let l_cNode of this.m_lNodes) {
            if (l_cNode.m_sType !== 'page') continue;
            
            const l_iBodyY = l_cNode.m_iY + 102; // Body (62) + offset initial des éléments (40)
            const l_iElementHeight = 30;
            
            for (let i = 0; i < l_cNode.m_lDisplayedElementIds.length; i++) {
                const l_iElementY = l_iBodyY + (i * l_iElementHeight) + 8;
                const l_iHandleX = l_cNode.m_iX + l_cNode.m_iWidth - 5;
                const l_fDistance = Math.hypot(l_iX - l_iHandleX, l_iY - l_iElementY);
                
                if (l_fDistance <= 8) {
                    // Double-clic sur un handle vert
                    const l_sElementId = l_cNode.m_lDisplayedElementIds[i];
                    
                    this.m_cSelectedNode = l_cNode;
                    this.m_iTempElementIndex = i;
                    this.m_cTempTargetNode = null;
                    this.m_sEditingLinkAction = null;
                    
                    this.F_vShowLinkDialog(l_cNode, null, null);
                    return;
                }
            }
        }
    }

    F_vAnimateSnap() {
        if (this.m_bDraggingLink && this.m_cSnapTargetNode) {
            this.F_vDraw();
            this.m_iAnimationFrame = requestAnimationFrame(() => this.F_vAnimateSnap());
        } else {
            this.m_iAnimationFrame = null;
        }
    }

    F_vShowLinkDialog(p_cNode, p_cElement, p_cTargetNode = null) {
        // Sauvegarder les nodes pour la création du lien
        this.m_cSelectedNode = p_cNode;
        
        // Si on a un targetNode (drag & drop), l'utiliser directement
        if (p_cTargetNode) {
            // Stocker temporairement la cible
            this.m_cTempTargetNode = p_cTargetNode;
        }
        
        // Déterminer l'élément source et son index
        let l_sElementId = null;
        let l_iElementIndex = -1;
        let l_sElementLabel = 'Composant';
        
        // Méthode 1: Utiliser m_iDraggingFromElementIndex (drag & drop)
        if (this.m_iDraggingFromElementIndex >= 0 && this.m_iDraggingFromElementIndex < p_cNode.m_lDisplayedElementIds.length) {
            l_iElementIndex = this.m_iDraggingFromElementIndex;
            l_sElementId = p_cNode.m_lDisplayedElementIds[l_iElementIndex];
        }
        // Méthode 2: Utiliser p_cElement si fourni (shift+click)
        else if (p_cElement) {
            l_sElementId = p_cElement.id;
            l_iElementIndex = p_cNode.m_lDisplayedElementIds.indexOf(l_sElementId);
        }
        // Méthode 3: Prendre le premier élément affiché
        else if (p_cNode.m_lDisplayedElementIds.length > 0) {
            l_iElementIndex = 0;
            l_sElementId = p_cNode.m_lDisplayedElementIds[0];
        }
        
        // Stocker l'index pour F_vCreateLink
        this.m_iTempElementIndex = l_iElementIndex;
        
        // Récupérer le label de l'élément
        if (l_sElementId) {
            const l_cElementForLabel = p_cNode.m_lElements.find(e => e.id === l_sElementId);
            if (l_cElementForLabel) {
                l_sElementLabel = l_cElementForLabel.label || 'Composant';
            }
        }
        
        // Récupérer les liens existants pour cet élément
        const l_cPage = window.G_cApp?.G_lPages.find(p => p.id === p_cNode.m_sId);
        const l_cElement = l_cPage?.elements?.find(e => e && e.id === l_sElementId);
        const l_aExistingLinks = l_cElement?.m_cNavigationLinks || [];
        
        let l_sExistingLinksHTML = '';
        if (l_aExistingLinks.length > 0) {
            l_sExistingLinksHTML = '<div style="background: #2d2d30; padding: 10px; border-radius: 4px; margin-bottom: 15px; border-left: 3px solid #0078d4;">';
            l_sExistingLinksHTML += '<h4 style="margin: 0 0 10px 0; font-size: 12px; color: #0078d4;">Liens existants:</h4>';
            l_aExistingLinks.forEach(link => {
                const l_cTargetPage = window.G_cApp?.G_lPages.find(p => p.id === link.targetPage);
                const l_sPageName = l_cTargetPage ? `${l_cTargetPage.icon} ${l_cTargetPage.title}` : 'Page inconnue';
                const l_sActionLabel = {
                    'click': 'Clic',
                    'dblclick': 'Double-clic',
                    'load': 'Chargement'
                }[link.action] || link.action;
                l_sExistingLinksHTML += `<div style="font-size: 11px; color: #d4d4d4; margin-bottom: 5px;">• ${l_sActionLabel} → ${l_sPageName}</div>`;
            });
            l_sExistingLinksHTML += '</div>';
        }
        
        const l_sHTML = `
            <div class="c-link-dialog">
                <h3>Créer un lien</h3>
                <p>De: <strong>${p_cNode.m_sLabel}</strong></p>
                <p>Élément: <strong>${l_sElementLabel}</strong></p>
                ${p_cTargetNode ? `<p>Vers: <strong>${p_cTargetNode.m_sLabel}</strong></p>` : ''}
                
                ${l_sExistingLinksHTML}
                
                ${!p_cTargetNode ? `
                <div class="c-form-group">
                    <label>Page cible:</label>
                    <select id="G_sGraphTargetPage">
                        ${this.m_lNodes.filter(n => n.m_sType === 'page' && n !== p_cNode).map(n => {
                            // Ajouter l'ID entre parenthèses pour différencier les pages avec le même nom
                            const l_sDisplayName = `${n.m_sLabel} (${n.m_sId})`;
                            return `<option value="${n.m_sId}">${l_sDisplayName}</option>`;
                        }).join('')}
                    </select>
                </div>
                ` : ''}
                
                <div class="c-form-group">
                    <label>Action:</label>
                    <select id="G_sGraphAction">
                        <option value="click">Click</option>
                        <option value="dblclick">Double Click</option>
                        <option value="load">Chargement de la page</option>
                    </select>
                </div>
                
                <div class="c-dialog-buttons">
                    <button onclick="G_cGraphVisualizer.F_vCancelLink()">Annuler</button>
                    <button onclick="G_cGraphVisualizer.F_vCreateLink()">Créer le lien</button>
                </div>
            </div>
        `;
        
        document.getElementById('G_sGraphDialogContainer').innerHTML = l_sHTML;
        document.getElementById('G_sGraphDialogContainer').style.display = 'flex';
    }
    
    F_vShowEditLinkDialog(p_cLink) {
        // Mode édition : ne pas conserver la cible temporaire du drag & drop
        this.m_cTempTargetNode = null;
        this.m_cSelectedNode = p_cLink.m_cFromNode;
        this.m_iTempElementIndex = p_cLink.m_iFromElementIndex;
        this.m_sEditingLinkAction = p_cLink.m_sAction;

        // Récupérer les informations du lien
        const l_sElementId = p_cLink.m_cFromNode.m_lDisplayedElementIds[p_cLink.m_iFromElementIndex];
        const l_cElement = p_cLink.m_cFromNode.m_lElements.find(e => e.id === l_sElementId);
        const l_sElementLabel = l_cElement?.label || 'Composant';
        
        // Récupérer tous les liens existants pour cet élément
        const l_cPage = window.G_cApp?.G_lPages.find(p => p.id === p_cLink.m_cFromNode.m_sId);
        const l_cElementData = l_cPage?.elements?.find(e => e && e.id === l_sElementId);
        const l_aExistingLinks = l_cElementData?.m_cNavigationLinks || [];
        
        let l_sExistingLinksHTML = '';
        if (l_aExistingLinks.length > 0) {
            l_sExistingLinksHTML = '<div style="background: #2d2d30; padding: 10px; border-radius: 4px; margin-bottom: 15px; border-left: 3px solid #0078d4;">';
            l_sExistingLinksHTML += '<h4 style="margin: 0 0 10px 0; font-size: 12px; color: #0078d4;">Liens existants:</h4>';
            l_aExistingLinks.forEach(link => {
                const l_cTargetPage = window.G_cApp?.G_lPages.find(p => p.id === link.targetPage);
                const l_sPageName = l_cTargetPage ? `${l_cTargetPage.icon} ${l_cTargetPage.title}` : 'Page inconnue';
                const l_sActionLabel = {
                    'click': 'Clic',
                    'dblclick': 'Double-clic',
                    'load': 'Chargement'
                }[link.action] || link.action;
                const l_sHighlight = link.action === p_cLink.m_sAction ? 'font-weight: bold; color: #ffc107;' : '';
                l_sExistingLinksHTML += `<div style="font-size: 11px; color: #d4d4d4; margin-bottom: 5px; ${l_sHighlight}">• ${l_sActionLabel} → ${l_sPageName}</div>`;
            });
            l_sExistingLinksHTML += '</div>';
        }
        
        const l_sHTML = `
            <div class="c-link-dialog">
                <h3>✏️ Modifier le lien</h3>
                <p>De: <strong>${p_cLink.m_cFromNode.m_sLabel}</strong></p>
                <p>Élément: <strong>${l_sElementLabel}</strong></p>
                
                ${l_sExistingLinksHTML}
                
                <div class="c-form-group">
                    <label>Page cible:</label>
                    <select id="G_sGraphTargetPage">
                        ${this.m_lNodes.filter(n => n.m_sType === 'page' && n !== p_cLink.m_cFromNode).map(n => {
                            // Ajouter l'ID entre parenthèses pour différencier les pages avec le même nom
                            const l_sDisplayName = `${n.m_sLabel} (${n.m_sId})`;
                            const l_bSelected = n.m_sId === p_cLink.m_cToNode.m_sId ? 'selected' : '';
                            return `<option value="${n.m_sId}" ${l_bSelected}>${l_sDisplayName}</option>`;
                        }).join('')}
                    </select>
                </div>
                
                <div class="c-form-group">
                    <label>Action:</label>
                    <select id="G_sGraphAction">
                        <option value="click" ${p_cLink.m_sAction === 'click' ? 'selected' : ''}>Click</option>
                        <option value="dblclick" ${p_cLink.m_sAction === 'dblclick' ? 'selected' : ''}>Double Click</option>
                        <option value="load" ${p_cLink.m_sAction === 'load' ? 'selected' : ''}>Chargement de la page</option>
                    </select>
                </div>
                
                <div class="c-dialog-buttons">
                    <button onclick="G_cGraphVisualizer.F_vDeleteLink()" style="background: #dc3545;">🗑️ Supprimer</button>
                    <button onclick="G_cGraphVisualizer.F_vCancelLink()">Annuler</button>
                    <button onclick="G_cGraphVisualizer.F_vCreateLink()">💾 Modifier</button>
                </div>
            </div>
        `;
        
        document.getElementById('G_sGraphDialogContainer').innerHTML = l_sHTML;
        document.getElementById('G_sGraphDialogContainer').style.display = 'flex';
    }

    F_vCreateLink() {
        if (!this.m_cSelectedNode) return;

        const l_bIsEditing = !!this.m_sEditingLinkAction;
        const l_sOriginalAction = this.m_sEditingLinkAction;

        let l_sTargetPageId;
        
        // Si on est en mode création via drag & drop, utiliser la cible temporaire
        if (!l_bIsEditing && this.m_cTempTargetNode) {
            l_sTargetPageId = this.m_cTempTargetNode.m_sId;
        } else {
            // Sinon, lire depuis le select
            const l_cSelect = document.getElementById('G_sGraphTargetPage');
            if (!l_cSelect) {
                console.error('[F_vCreateLink] Sélecteur de page cible introuvable');
                return;
            }
            l_sTargetPageId = l_cSelect.value;
        }

        const l_cActionSelect = document.getElementById('G_sGraphAction');
        const l_sAction = l_cActionSelect ? l_cActionSelect.value : (this.m_sEditingLinkAction || 'click');
        
        const l_cTargetNode = this.m_lNodes.find(n => n.m_sId === l_sTargetPageId);
        if (!l_cTargetNode) return;

        const l_cSourceNode = this.m_cSelectedNode;
        
        // Utiliser l'index stocké par F_vShowLinkDialog
        let l_iElementIndex = this.m_iTempElementIndex;
        let l_sElementId = null;

        if (l_iElementIndex >= 0 && l_iElementIndex < l_cSourceNode.m_lDisplayedElementIds.length) {
            l_sElementId = l_cSourceNode.m_lDisplayedElementIds[l_iElementIndex];
        }

        if (l_iElementIndex === -1 || !l_sElementId) {
            console.error('[F_vCreateLink] Impossible de créer le lien: élément source introuvable', {
                m_iTempElementIndex: this.m_iTempElementIndex,
                m_lDisplayedElementIds: l_cSourceNode.m_lDisplayedElementIds
            });
            alert('Erreur: élément source introuvable');
            return;
        }
        
        // Supprimer les liens existants pour ce même élément + action
        this.m_lLinks = this.m_lLinks.filter(link => {
            const l_bSameElement = link.m_cFromNode === l_cSourceNode && link.m_iFromElementIndex === l_iElementIndex;
            if (!l_bSameElement) return true;
            if (l_bIsEditing && l_sOriginalAction && link.m_sAction === l_sOriginalAction) return false;
            if (link.m_sAction === l_sAction) return false;
            return true;
        });

        // Créer le nouveau lien visuel
        const l_cLink = new C_GraphLink(
            l_cSourceNode,
            l_iElementIndex,
            l_cTargetNode,
            l_sAction
        );
        this.m_lLinks.push(l_cLink);

        // Marquer l'élément comme ayant un lien
        const l_cElementInList = l_cSourceNode.m_lElements.find(e => e.id === l_sElementId);
        if (l_cElementInList) {
            l_cElementInList.hasLink = true;
        }

        // Si on change d'action lors d'une édition, supprimer l'ancien lien dans les données
        if (l_bIsEditing && l_sOriginalAction && l_sOriginalAction !== l_sAction) {
            this.F_vRemoveLinkDataInternal(l_cSourceNode.m_sId, l_sElementId, l_sOriginalAction, false);
        }

        // Ajouter/Modifier l'événement dans les données (G_lPages)
        // Cette fonction gère automatiquement le remplacement des liens existants
        this.F_vAddEventToElement(
            l_cSourceNode.m_sId,
            l_sElementId,
            l_sTargetPageId,
            l_sAction
        );

        this.F_vUpdateComponentDropdown();
        
        // Rafraîchir les propriétés si l'élément est actuellement sélectionné
        if (window.G_cApp && window.G_cApp.G_cSelectedElement && window.G_cApp.G_cSelectedElement.id === l_sElementId) {
            window.G_cApp.f_vRenderProperties();
        }
        
        // Afficher un toast
        const l_cTargetPage = window.G_cApp.G_lPages.find(p => p.id === l_sTargetPageId);
        const l_sTargetName = l_cTargetPage ? (l_cTargetPage.title || l_cTargetPage.name) : 'Page inconnue';
        if (window.G_cApp && window.G_cApp.f_vShowToast) {
            const l_sToastPrefix = l_bIsEditing ? 'Lien modifié' : 'Lien créé';
            window.G_cApp.f_vShowToast(`${l_sToastPrefix}: ${l_sAction} → ${l_sTargetName}`, 'success');
        }
        
        // Nettoyer les variables temporaires
        this.m_iTempElementIndex = -1;
        this.m_cTempTargetNode = null;
        this.m_cSelectedElement = null;
        this.m_sEditingLinkAction = null;
        
        this.F_vCancelLink();
        this.F_vDraw();
    }

    F_vAddEventToElement(p_sPageId, p_sElementId, p_sTargetPageId, p_sAction) {
        // Trouver la page
        const l_cPage = window.G_cApp.G_lPages.find(p => p.id === p_sPageId);
        if (!l_cPage) {
            console.error('[Graph] Page introuvable:', p_sPageId);
            return;
        }
        
        // S'assurer que la page a un tableau d'éléments
        if (!l_cPage.elements) {
            l_cPage.elements = [];
        }
        
        // Trouver l'élément dans la page (format JSON)
        const l_cElement = (window.G_cApp && typeof window.G_cApp.f_cFindElementDataById === 'function')
            ? window.G_cApp.f_cFindElementDataById(l_cPage.elements, p_sElementId)
            : l_cPage.elements.find(e => e && e.id === p_sElementId);
        if (!l_cElement) {
            console.error('[Graph] Élément introuvable dans la page:', p_sElementId, 'Page:', p_sPageId);
            console.log('[Graph] Éléments disponibles:', l_cPage.elements.map(e => e?.id));
            return;
        }
        
        console.log('[Graph] Ajout lien à l\'élément:', p_sElementId, 'vers page:', p_sTargetPageId, 'action:', p_sAction);
        
        // Initialiser les structures de navigation si nécessaire
        if (!l_cElement.m_cNavigationLinks) {
            l_cElement.m_cNavigationLinks = [];
        }
        
        if (!l_cElement.attributes) {
            l_cElement.attributes = {};
        }
        
        if (!l_cElement.attributes.navigationActions) {
            l_cElement.attributes.navigationActions = {
                onClick: null,
                onDoubleClick: null,
                onLoad: null
            };
        }
        
        // Vérifier si un lien avec la même action existe déjà
        const l_iExistingLinkIndex = l_cElement.m_cNavigationLinks.findIndex(link => link.action === p_sAction);
        
        if (l_iExistingLinkIndex !== -1) {
            // Remplacer l'ancien lien par le nouveau
            console.log('[Graph] Remplacement du lien existant pour l\'action:', p_sAction);
            l_cElement.m_cNavigationLinks[l_iExistingLinkIndex] = {
                targetPage: p_sTargetPageId,
                action: p_sAction
            };
        } else {
            // Ajouter un nouveau lien
            l_cElement.m_cNavigationLinks.push({
                targetPage: p_sTargetPageId,
                action: p_sAction
            });
        }
        
        // Synchroniser avec navigationActions (format propriétés)
        const actionMap = {
            'click': 'onClick',
            'dblclick': 'onDoubleClick',
            'load': 'onLoad'
        };
        
        const actionKey = actionMap[p_sAction];
        if (actionKey) {
            l_cElement.attributes.navigationActions[actionKey] = p_sTargetPageId;
        }
        
        // Si c'est la page courante, mettre à jour aussi l'élément dans G_lElements
        if (window.G_cApp.G_cCurrentPage && window.G_cApp.G_cCurrentPage.id === p_sPageId) {
            const l_cLiveElement = (typeof window.G_cApp.f_cFindElementById === 'function')
                ? window.G_cApp.f_cFindElementById(p_sElementId)
                : window.G_cApp.G_lElements.find(e => e && e.id === p_sElementId);
            if (l_cLiveElement) {
                // Synchroniser m_cNavigationLinks
                if (!l_cLiveElement.m_cNavigationLinks) {
                    l_cLiveElement.m_cNavigationLinks = [];
                }
                
                // Vérifier si un lien avec la même action existe déjà
                const l_iExistingLiveLinkIndex = l_cLiveElement.m_cNavigationLinks.findIndex(link => link.action === p_sAction);
                
                if (l_iExistingLiveLinkIndex !== -1) {
                    // Remplacer l'ancien lien par le nouveau
                    l_cLiveElement.m_cNavigationLinks[l_iExistingLiveLinkIndex] = {
                        targetPage: p_sTargetPageId,
                        action: p_sAction
                    };
                } else {
                    // Ajouter un nouveau lien
                    l_cLiveElement.m_cNavigationLinks.push({
                        targetPage: p_sTargetPageId,
                        action: p_sAction
                    });
                }
                
                // Synchroniser navigationActions
                if (!l_cLiveElement.attributes) {
                    l_cLiveElement.attributes = {};
                }
                if (!l_cLiveElement.attributes.navigationActions) {
                    l_cLiveElement.attributes.navigationActions = {
                        onClick: null,
                        onDoubleClick: null,
                        onLoad: null
                    };
                }
                if (actionKey) {
                    l_cLiveElement.attributes.navigationActions[actionKey] = p_sTargetPageId;
                }
            }
            
            // Sauvegarder immédiatement dans la page
            window.G_cApp.G_cCurrentPage.elements = window.G_cApp.G_lElements.map(e =>
                typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
            );
        }
        
        // Mettre à jour le graphe
        const l_cNode = this.m_lNodes.find(l_cGraphNode => l_cGraphNode.m_sId === p_sPageId);
        if (l_cNode) {
            const l_cGraphElement = l_cNode.m_lElements.find(l_cElt => l_cElt.id === p_sElementId);
            if (l_cGraphElement) {
                l_cGraphElement.hasLink = true;
            }
        }

        // Rafraîchir les propriétés si l'élément est actuellement sélectionné
        if (window.G_cApp && window.G_cApp.G_cSelectedElement && window.G_cApp.G_cSelectedElement.id === p_sElementId) {
            window.G_cApp.f_vRenderProperties();
        }
    }

    F_vRemoveLinkDataInternal(p_sPageId, p_sElementId, p_sAction, p_bUpdateGraph = true) {
        const l_cPage = window.G_cApp.G_lPages.find(p => p.id === p_sPageId);
        if (!l_cPage) return false;

        const l_cElement = (window.G_cApp && typeof window.G_cApp.f_cFindElementDataById === 'function')
            ? window.G_cApp.f_cFindElementDataById(l_cPage.elements || [], p_sElementId)
            : l_cPage.elements?.find(e => e && e.id === p_sElementId);
        if (!l_cElement) return false;

        let l_bModified = false;

        if (Array.isArray(l_cElement.m_cNavigationLinks)) {
            const l_iBefore = l_cElement.m_cNavigationLinks.length;
            l_cElement.m_cNavigationLinks = l_cElement.m_cNavigationLinks.filter(link => link.action !== p_sAction);
            if (l_cElement.m_cNavigationLinks.length !== l_iBefore) {
                l_bModified = true;
            }
        }

        const actionMap = {
            'click': 'onClick',
            'dblclick': 'onDoubleClick',
            'load': 'onLoad'
        };
        const actionKey = actionMap[p_sAction];
        if (actionKey && l_cElement.attributes?.navigationActions && l_cElement.attributes.navigationActions[actionKey] !== null) {
            l_cElement.attributes.navigationActions[actionKey] = null;
            l_bModified = true;
        }

        if (window.G_cApp.G_cCurrentPage && window.G_cApp.G_cCurrentPage.id === p_sPageId) {
            const l_cLiveElement = (typeof window.G_cApp.f_cFindElementById === 'function')
                ? window.G_cApp.f_cFindElementById(p_sElementId)
                : window.G_cApp.G_lElements.find(e => e && e.id === p_sElementId);
            if (l_cLiveElement) {
                if (Array.isArray(l_cLiveElement.m_cNavigationLinks)) {
                    const l_iBefore = l_cLiveElement.m_cNavigationLinks.length;
                    l_cLiveElement.m_cNavigationLinks = l_cLiveElement.m_cNavigationLinks.filter(link => link.action !== p_sAction);
                    if (l_cLiveElement.m_cNavigationLinks.length !== l_iBefore) {
                        l_bModified = true;
                    }
                }
                if (actionKey && l_cLiveElement.attributes?.navigationActions && l_cLiveElement.attributes.navigationActions[actionKey] !== null) {
                    l_cLiveElement.attributes.navigationActions[actionKey] = null;
                    l_bModified = true;
                }
            }

            if (l_bModified) {
                window.G_cApp.G_cCurrentPage.elements = window.G_cApp.G_lElements.map(e =>
                    typeof e.F_cToJSON === 'function' ? e.F_cToJSON() : e
                );
            }
        }

        if (p_bUpdateGraph && l_bModified) {
            const l_cNode = this.m_lNodes.find(node => node.m_sId === p_sPageId);
            if (l_cNode) {
                const l_cGraphElement = l_cNode.m_lElements.find(el => el.id === p_sElementId);
                if (l_cGraphElement) {
                    l_cGraphElement.hasLink = Array.isArray(l_cElement.m_cNavigationLinks) && l_cElement.m_cNavigationLinks.length > 0;
                }
            }
        }

        return l_bModified;
    }
    
    F_vDeleteLink() {
        if (!this.m_cSelectedNode || this.m_iTempElementIndex < 0) return;
        
        const l_sElementId = this.m_cSelectedNode.m_lDisplayedElementIds[this.m_iTempElementIndex];
        if (!l_sElementId) return;
        
        // Récupérer l'action à supprimer
        const l_sAction = this.m_sEditingLinkAction || document.getElementById('G_sGraphAction')?.value;
        if (!l_sAction) return;
        
        // Confirmation
        if (!confirm(`Voulez-vous vraiment supprimer ce lien (${l_sAction}) ?`)) {
            return;
        }
        
        const l_bRemoved = this.F_vRemoveLinkDataInternal(this.m_cSelectedNode.m_sId, l_sElementId, l_sAction, true);
        if (!l_bRemoved) {
            console.warn('[Graph] Aucun lien à supprimer pour', l_sElementId, l_sAction);
            return;
        }

        // Supprimer le lien visuel
        this.m_lLinks = this.m_lLinks.filter(link => 
            !(link.m_cFromNode === this.m_cSelectedNode &&
              link.m_iFromElementIndex === this.m_iTempElementIndex &&
              link.m_sAction === l_sAction)
        );

        // Mettre à jour le flag hasLink
        const l_cGraphElement = this.m_cSelectedNode.m_lElements.find(el => el.id === l_sElementId);
        if (l_cGraphElement) {
            const l_cPage = window.G_cApp.G_lPages.find(p => p.id === this.m_cSelectedNode.m_sId);
            const l_cElement = l_cPage?.elements?.find(e => e && e.id === l_sElementId);
            l_cGraphElement.hasLink = !!(l_cElement?.m_cNavigationLinks && l_cElement.m_cNavigationLinks.length > 0);
        }

        this.F_vUpdateComponentDropdown();
        this.F_vDraw();

        // Rafraîchir les propriétés si nécessaire
        if (window.G_cApp && window.G_cApp.G_cSelectedElement && window.G_cApp.G_cSelectedElement.id === l_sElementId) {
            window.G_cApp.f_vRenderProperties();
        }

        // Toast
        if (window.G_cApp && window.G_cApp.f_vShowToast) {
            window.G_cApp.f_vShowToast(`Lien supprimé: ${l_sAction}`, 'success');
        }
        
        // Fermer le dialogue
        this.F_vCancelLink();
        this.F_vDraw();
    }

    F_vCancelLink() {
        this.m_cSelectedElement = null;
        this.m_cTempTargetNode = null;
        this.m_iTempElementIndex = -1;
        this.m_sEditingLinkAction = null;
        const l_cDialog = document.getElementById('G_sGraphDialogContainer');
        if (l_cDialog) {
            l_cDialog.innerHTML = '';
            l_cDialog.style.display = 'none';
        }
    }

    F_vDraw() {
        if (!this.m_cCtx) return;

        // Clear
        this.m_cCtx.clearRect(0, 0, this.m_cCanvas.width, this.m_cCanvas.height);
        
        // Background dark theme
        this.m_cCtx.fillStyle = '#1e1e1e';
        this.m_cCtx.fillRect(0, 0, this.m_cCanvas.width, this.m_cCanvas.height);
        
        // Grille subtile
        this.m_cCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.m_cCtx.lineWidth = 1;
        const gridSize = 20;
        for (let x = 0; x < this.m_cCanvas.width; x += gridSize) {
            this.m_cCtx.beginPath();
            this.m_cCtx.moveTo(x, 0);
            this.m_cCtx.lineTo(x, this.m_cCanvas.height);
            this.m_cCtx.stroke();
        }
        for (let y = 0; y < this.m_cCanvas.height; y += gridSize) {
            this.m_cCtx.beginPath();
            this.m_cCtx.moveTo(0, y);
            this.m_cCtx.lineTo(this.m_cCanvas.width, y);
            this.m_cCtx.stroke();
        }

        // Apply transformations
        this.m_cCtx.save();
        this.m_cCtx.translate(this.m_iOffsetX, this.m_iOffsetY);
        this.m_cCtx.scale(this.m_fScale, this.m_fScale);

        // Dessiner les liens
        this.m_lLinks.forEach(l_cLink => l_cLink.F_vDraw(this.m_cCtx));

        // Dessiner la ligne temporaire si on est en train de créer un lien
        if (this.m_bDraggingLink && this.m_cDraggingFromNode && this.m_iDraggingFromElementIndex !== -1) {
            // Calculer la position du point vert de l'élément spécifique (même calcul que dans F_vDraw)
            const l_iBodyY = this.m_cDraggingFromNode.m_iY + 102; // Body (62) + offset initial des éléments (40)
            const l_iElementHeight = 30;
            const l_iElementY = l_iBodyY + (this.m_iDraggingFromElementIndex * l_iElementHeight) + 8;
            const l_iHandleX = this.m_cDraggingFromNode.m_iX + this.m_cDraggingFromNode.m_iWidth - 5;
            const l_iHandleY = l_iElementY;
            
            // Ligne en pointillés vers le curseur
            this.m_cCtx.strokeStyle = '#28a745';
            this.m_cCtx.lineWidth = 3;
            this.m_cCtx.setLineDash([8, 4]);
            
            this.m_cCtx.beginPath();
            this.m_cCtx.moveTo(l_iHandleX, l_iHandleY);
            
            // Courbe de Bézier vers le curseur
            const l_iControlPointOffset = Math.abs(this.m_iDragLinkMouseX - l_iHandleX) / 2;
            this.m_cCtx.bezierCurveTo(
                l_iHandleX + l_iControlPointOffset, l_iHandleY,
                this.m_iDragLinkMouseX - l_iControlPointOffset, this.m_iDragLinkMouseY,
                this.m_iDragLinkMouseX, this.m_iDragLinkMouseY
            );
            this.m_cCtx.stroke();
            this.m_cCtx.setLineDash([]);
            
            // Cercle au curseur
            this.m_cCtx.fillStyle = '#28a745';
            this.m_cCtx.beginPath();
            this.m_cCtx.arc(this.m_iDragLinkMouseX, this.m_iDragLinkMouseY, 6, 0, Math.PI * 2);
            this.m_cCtx.fill();
            
            this.m_cCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.m_cCtx.lineWidth = 2;
            this.m_cCtx.stroke();
        }

        // Dessiner les nodes
        this.m_lNodes.forEach(l_cNode => {
            const l_bHighlight = this.m_bDraggingLink && this.m_cSnapTargetNode === l_cNode;
            l_cNode.F_vDraw(this.m_cCtx, l_cNode === this.m_cSelectedNode, l_bHighlight);
        });
        
        // Si on est snappé sur un handle, dessiner un effet visuel
        if (this.m_bDraggingLink && this.m_cSnapTargetNode) {
            const l_cSnapHandle = this.m_cSnapTargetNode.F_cGetHandlePosition('incoming');
            if (l_cSnapHandle) {
                // Cercle pulsant autour du handle
                this.m_cCtx.strokeStyle = '#ff6f61';
                this.m_cCtx.lineWidth = 3;
                this.m_cCtx.globalAlpha = 0.6;
                
                // Animation de pulsation (utiliser un cycle basé sur le temps)
                const l_fPulse = 1 + Math.sin(Date.now() / 200) * 0.3;
                
                this.m_cCtx.beginPath();
                this.m_cCtx.arc(l_cSnapHandle.x, l_cSnapHandle.y, 15 * l_fPulse, 0, Math.PI * 2);
                this.m_cCtx.stroke();
                
                this.m_cCtx.beginPath();
                this.m_cCtx.arc(l_cSnapHandle.x, l_cSnapHandle.y, 20 * l_fPulse, 0, Math.PI * 2);
                this.m_cCtx.stroke();
                
                this.m_cCtx.globalAlpha = 1;
            }
        }

        this.m_cCtx.restore();

        // Instructions avec le style de l'app
    this.m_cCtx.fillStyle = 'rgba(45, 45, 45, 0.95)';
    this.m_cCtx.fillRect(10, 10, 350, 110);
        this.m_cCtx.strokeStyle = '#0078d4';
        this.m_cCtx.lineWidth = 2;
    this.m_cCtx.strokeRect(10, 10, 350, 110);
        
    this.m_cCtx.fillStyle = '#fff';
    this.m_cCtx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    this.m_cCtx.textAlign = 'left';
    this.m_cCtx.fillText('• Cliquez sur une page pour afficher ses composants', 20, 35);
    this.m_cCtx.fillText('• Sélectionnez un composant via la liste au-dessus', 20, 55);
    this.m_cCtx.fillText('• Faites glisser le point de droite vers la page cible', 20, 75);
    this.m_cCtx.fillText('• Molette pour zoomer / glisser pour déplacer la vue', 20, 95);
    }

    F_vRefresh() {
        this.F_vGenerateNodesFromPages();
        this.F_vDraw();
    }
}

// Instance globale
window.G_cGraphVisualizer = new C_GraphVisualizer();
