import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {navigationRef} from './src/navigation/navigationRef';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import './src/i18n';
import {AppNavigationTheme} from './src/theme/navigationTheme';
import {colors} from './src/theme/tokens';
import {UserProvider} from './src/context/UserContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {APPODEAL_APP_KEY} from './src/config';
import {TonConnectProvider} from './src/tonconnect/provider/TonConnectProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {retry: 1},
  },
});

function AppodealInit() {
  useEffect(() => {
    if (!APPODEAL_APP_KEY || APPODEAL_APP_KEY.startsWith('YOUR_')) {
      if (__DEV__) {
        console.warn('[Appodeal] Set APPODEAL_APP_KEY in src/config.ts');
      }
      return;
    }
    try {
      const Appodeal = require('react-native-appodeal').default;
      const {AppodealAdType} = require('react-native-appodeal');
      Appodeal.initialize(APPODEAL_APP_KEY, AppodealAdType.REWARDED_VIDEO);
      if (__DEV__) {
        Appodeal.setTesting?.(true);
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('[Appodeal] Native module unavailable:', e);
      }
    }
  }, []);
  return null;
}

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: colors.bg}}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider style={{flex: 1, backgroundColor: colors.bg}}>
          <UserProvider>
            <TonConnectProvider>
              <AppodealInit />
              <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
              <NavigationContainer ref={navigationRef} theme={AppNavigationTheme}>
                <RootNavigator />
              </NavigationContainer>
            </TonConnectProvider>
          </UserProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;
