/**
 * Templates UI par défaut - Fallback si fichiers JSON non chargés
 */
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
