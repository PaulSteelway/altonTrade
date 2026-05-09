import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  InteractionManager,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useUserContext} from '../context/UserContext';
import {
  initTelegramAuth,
  exchangeTelegramCode,
  loginWithTelegramIdToken,
} from '../api/auth';
import {formatApiError} from '../api/errors';
import {TelegramAuthModal} from '../components/TelegramAuthModal';
import {colors, radii, space} from '../theme/tokens';

const LOGO = require('../../branding/altonLogo.png');

export function LoginScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {setToken, refetchUser} = useUserContext();
  const [busy, setBusy] = useState(false);
  const [devToken, setDevToken] = useState('');

  const [authModal, setAuthModal] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [sessionId, setSessionId] = useState('');

  const onTelegramPress = useCallback(async () => {
    setBusy(true);
    try {
      const session = await initTelegramAuth();
      setAuthUrl(session.authUrl);
      setRedirectUri(session.redirectUri);
      setSessionId(session.sessionId);
      setAuthModal(true);
    } catch (e: unknown) {
      Alert.alert(t('Error login'), formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [t]);

  const onAuthCode = useCallback(
    (code: string) => {
      const sid = sessionId;
      setAuthModal(false);
      setAuthUrl('');
      setRedirectUri('');
      setBusy(true);
      InteractionManager.runAfterInteractions(() => {
        void (async () => {
          try {
            const {token} = await exchangeTelegramCode(code, sid);
            await setToken(token);
            await refetchUser();
          } catch (e: unknown) {
            Alert.alert(t('Error login'), formatApiError(e));
          } finally {
            setBusy(false);
          }
        })();
      });
    },
    [sessionId, setToken, refetchUser, t],
  );

  const onAuthCancel = useCallback(() => {
    setAuthModal(false);
    setAuthUrl('');
    setRedirectUri('');
  }, []);

  const onDevLogin = async () => {
    if (!devToken.trim()) {
      return;
    }
    setBusy(true);
    try {
      const {token} = await loginWithTelegramIdToken(devToken.trim());
      await setToken(token);
      await refetchUser();
    } catch {
      Alert.alert(t('Error login'), 'Invalid id_token');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, {paddingTop: insets.top}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.wrap,
          {paddingBottom: Math.max(space.lg, insets.bottom + space.md)},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Alton Trader</Text>
          <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
            disabled={busy}
            activeOpacity={0.85}
            onPress={onTelegramPress}>
            <Text style={styles.primaryBtnText}>
              {t('Sign in with Telegram')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hintLegal}>
            {t('Login')} · Telegram (OIDC · BotFather)
          </Text>
        </View>

        {__DEV__ && (
          <View style={styles.dev}>
            <Text style={styles.devHint}>Dev: OIDC id_token</Text>
            <TextInput
              style={styles.input}
              value={devToken}
              onChangeText={setDevToken}
              placeholder="id_token JWT"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              multiline
            />
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDevLogin}>
              <Text style={styles.secondaryBtnText}>Dev login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TelegramAuthModal
        key={sessionId || 'telegram-auth'}
        visible={authModal}
        authUrl={authUrl}
        redirectUri={redirectUri}
        onCode={onAuthCode}
        onCancel={onAuthCancel}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  wrap: {
    flexGrow: 1,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: space.xl,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 52,
    height: 52,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: space.sm,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.disabledBg,
    opacity: 0.85,
  },
  primaryBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hintLegal: {
    marginTop: space.md,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  dev: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  devHint: {
    marginBottom: space.sm,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: space.sm,
    minHeight: 72,
    fontSize: 11,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryBtn: {
    marginTop: space.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
