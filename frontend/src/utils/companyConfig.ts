export const COMPANY_KEY = (import.meta.env.VITE_COMPANY || 'shreeji').toLowerCase();
export const isKarnavati = COMPANY_KEY === 'karnavati';
export const isShreeji = !isKarnavati;

export const COMPANY_CONFIG = isKarnavati
  ? {
      name: 'Karnavati Agro Products',
      pdfTitle: 'KARNAVATI AGRO PRODUCTS',
      address: 'Surat, Gujarat', // Update with exact address if required
      logo: '/karnavati.jpeg',
      cookieName: 'Karnavati_Agro',
    }
  : {
      name: 'Shreeji Veg',
      pdfTitle: 'SHREEJI VEG. & FRUIT',
      address: 'D-31, Vishal Nagar Society, B/s. Sardar Bridge, Adajan Road, SURAT',
      phone: 'Phone (O): 9924613277 , Mobile No.: 7211177000',
      logo: '/01.png',
      cookieName: 'Shreeji_Veg',
    };

// Automatically set document title and favicons on app init
if (typeof document !== 'undefined') {
  document.title = COMPANY_CONFIG.name;
  
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = COMPANY_CONFIG.logo;
  }
  const appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (appleTouchIcon) {
    appleTouchIcon.href = COMPANY_CONFIG.logo;
  }
}
