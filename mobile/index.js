import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';
import { initSentry, Sentry } from './src/lib/sentry';

initSentry();

registerRootComponent(Sentry.wrap(App));
