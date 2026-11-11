if('serviceWorker' in navigator&&!(window.Capacitor&&window.Capacitor.isNativePlatform())){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
