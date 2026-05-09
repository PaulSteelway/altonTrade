import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useMutation} from '@tanstack/react-query';
import {CommonActions} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {api} from '../api/client';
import {useUserContext} from '../context/UserContext';
import {navigationRef} from '../navigation/navigationRef';
import {colors, radii, space} from '../theme/tokens';

export function OnboardingScreen() {
  const {userData, refetchUser} = useUserContext();
  const [err, setErr] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const m = useMutation({
    mutationFn: async () => {
      const uid = userData?.user_id;
      if (uid == null) {
        throw new Error('No user');
      }
      await api.post('/api/users/pointLevel', {userId: uid});
    },
    onSuccess: async () => {
      await refetchUser();
      navigationRef.dispatch(
        CommonActions.reset({index: 0, routes: [{name: 'MainTabs'}]}),
      );
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <View style={[styles.wrap, {paddingTop: insets.top + space.lg}]}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.sub}>
        Set your starting level to continue — same flow as on the web app.
      </Text>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <TouchableOpacity
        style={[styles.btn, m.isPending && styles.btnDisabled]}
        disabled={m.isPending}
        activeOpacity={0.85}
        onPress={() => m.mutate()}>
        {m.isPending ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.btnText}>Get started</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: space.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    marginBottom: space.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: space.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  btnDisabled: {opacity: 0.75},
  btnText: {color: colors.textPrimary, fontWeight: '600', fontSize: 16},
  err: {color: colors.error, marginBottom: space.sm, textAlign: 'center'},
});
