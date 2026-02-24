import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// Global error handler to catch "Network request failed" and other crashes
if (global.ErrorUtils) {
    const defaultHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        if (error?.message?.includes('Network request failed')) {
            console.warn('Caught network error:', error.message);
            return;
        }
        defaultHandler(error, isFatal);
    });
}

registerRootComponent(App);
