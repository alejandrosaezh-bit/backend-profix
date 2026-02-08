import { registerRootComponent } from 'expo';

// Como ahora index.js y app.js están juntos en la raíz, esto funcionará:
import App from './app';

registerRootComponent(App);