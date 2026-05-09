import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

import {useUserContext} from '../context/UserContext';
import {colors} from '../theme/tokens';
import {LoginScreen} from '../screens/LoginScreen';
import {MainTabs} from './MainTabs';
import {ProfileScreen} from '../screens/ProfileScreen';
import {WalletScreen} from '../screens/WalletScreen';
import {ConnectWalletExampleScreen} from '../screens/ConnectWalletExampleScreen';
import {OnboardingScreen} from '../screens/OnboardingScreen';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});

export function RootNavigator() {
  const {token, bootstrapping, userData} = useUserContext();

  if (bootstrapping) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const needsOnboarding =
    !!token &&
    userData &&
    (userData.pointLevel === undefined || userData.pointLevel === null);

  const initialRouteName = !token
    ? 'Login'
    : needsOnboarding
      ? 'Onboarding'
      : 'MainTabs';

  return (
    <Stack.Navigator
      key={token ?? 'guest'}
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.bg},
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{headerShown: true, title: 'Wallet'}}
      />
      <Stack.Screen
        name="ConnectWalletExample"
        component={ConnectWalletExampleScreen}
        options={{headerShown: true, title: 'TON Connect'}}
      />
    </Stack.Navigator>
  );
}
