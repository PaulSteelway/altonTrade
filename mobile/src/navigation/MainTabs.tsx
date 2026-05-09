import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  TabIconAcademy,
  TabIconBoosts,
  TabIconFriends,
  TabIconHome,
  TabIconMissions,
} from '../components/TabIcons';
import {HomeScreen} from '../screens/HomeScreen';
import {useUserContext} from '../context/UserContext';
import {colors} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {RouletteScreen} from '../screens/RouletteScreen';
import {BoostsScreen} from '../screens/BoostsScreen';
import {AcademyScreen} from '../screens/AcademyScreen';
import {AcademyDetailScreen} from '../screens/AcademyDetailScreen';
import {AcademyTestScreen} from '../screens/AcademyTestScreen';
import {MissionsScreen} from '../screens/MissionsScreen';
import {FriendsScreen} from '../screens/FriendsScreen';
import {WalletScreen} from '../screens/WalletScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  Roulette: undefined;
  Wallet: undefined;
};

export type AcademyStackParamList = {
  AcademyList: undefined;
  AcademyDetail: {lessonId: number};
  AcademyTest: {lessonId: number};
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNav() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.bg},
      }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen
        name="Roulette"
        component={RouletteScreen}
        options={{headerShown: false}}
      />
      <HomeStack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{title: 'Wallet', headerShown: true}}
      />
    </HomeStack.Navigator>
  );
}

const AcademyStack = createNativeStackNavigator<AcademyStackParamList>();
function AcademyStackNav() {
  return (
    <AcademyStack.Navigator
      screenOptions={{
        contentStyle: {backgroundColor: colors.bg},
        headerStyle: {backgroundColor: colors.surface},
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {fontFamily: fontFamily.semibold},
      }}>
      <AcademyStack.Screen
        name="AcademyList"
        component={AcademyScreen}
        options={{headerShown: false}}
      />
      <AcademyStack.Screen
        name="AcademyDetail"
        component={AcademyDetailScreen}
        options={({route}) => ({
          title: `Lesson ${route.params.lessonId}`,
        })}
      />
      <AcademyStack.Screen
        name="AcademyTest"
        component={AcademyTestScreen}
        options={{title: 'Test'}}
      />
    </AcademyStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

/** Параметры иконки как у React Navigation (размер из темы, цвет active/inactive). */
function TabBarIconHome({color, size = 24}: {color: string; size?: number}) {
  return <TabIconHome color={color} size={size} />;
}
function TabBarIconBoosts({color, size = 24}: {color: string; size?: number}) {
  return <TabIconBoosts color={color} size={size} />;
}
function TabBarIconAcademy({color, size = 24}: {color: string; size?: number}) {
  return <TabIconAcademy color={color} size={size} />;
}
function TabBarIconMissions({color, size = 24}: {color: string; size?: number}) {
  return <TabIconMissions color={color} size={size} />;
}
function TabBarIconFriends({color, size = 24}: {color: string; size?: number}) {
  return <TabIconFriends color={color} size={size} />;
}

export function MainTabs() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {userData} = useUserContext();

  const academyRemaining =
    typeof userData?.remainingAcademiesCount === 'number'
      ? userData.remainingAcademiesCount
      : 0;
  const academyBadge =
    academyRemaining > 0
      ? academyRemaining > 99
        ? '99+'
        : String(academyRemaining)
      : undefined;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: {backgroundColor: colors.bg},
        /** [BottomNavigation.css](frontend/src/assets/css/BottomNavigation.css) */
        tabBarActiveTintColor: '#e62159',
        tabBarInactiveTintColor: '#757f9c',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          fontFamily: fontFamily.medium,
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginBottom: 5,
        },
        tabBarItemStyle: {
          flex: 1,
        },
        tabBarStyle: {
          backgroundColor: '#161c2c',
          borderTopWidth: 1,
          borderTopColor: '#46506d',
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingTop: 16,
          paddingBottom: Math.max(16, insets.bottom),
          minHeight: 76 + Math.max(0, insets.bottom),
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: {width: 0, height: -2},
              shadowOpacity: 0.3,
              shadowRadius: 10,
            },
            android: {
              elevation: 12,
            },
          }),
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackNav}
        options={{
          tabBarLabel: t('Home'),
          tabBarIcon: TabBarIconHome,
        }}
      />
      <Tab.Screen
        name="Boosts"
        component={BoostsScreen}
        options={{
          tabBarLabel: t('Boosts'),
          tabBarIcon: TabBarIconBoosts,
        }}
      />
      <Tab.Screen
        name="Academy"
        component={AcademyStackNav}
        options={{
          tabBarLabel: t('Academy'),
          tabBarBadge: academyBadge,
          tabBarBadgeStyle: {
            backgroundColor: '#881032',
            color: '#ffffff',
            fontSize: 12,
            fontFamily: fontFamily.medium,
            fontWeight: '500',
            minWidth: 20,
            maxHeight: 20,
            lineHeight: 14,
            borderRadius: 100,
          },
          tabBarIcon: TabBarIconAcademy,
        }}
      />
      <Tab.Screen
        name="Missions"
        component={MissionsScreen}
        options={{
          tabBarLabel: t('Missions'),
          tabBarIcon: TabBarIconMissions,
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarLabel: t('Friends'),
          tabBarIcon: TabBarIconFriends,
        }}
      />
    </Tab.Navigator>
  );
}
