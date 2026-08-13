import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import { initSentry, Sentry } from './src/lib/sentry';

initSentry();

const Root = () => Sentry.wrap(App);
AppRegistry.registerComponent(appName, Root);
AppRegistry.registerComponent('main', Root);
