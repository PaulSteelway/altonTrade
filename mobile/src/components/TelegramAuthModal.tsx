import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import WebView, {
  type WebViewNavigation,
} from 'react-native-webview';

import {colors} from '../theme/tokens';

interface Props {
  visible: boolean;
  authUrl: string;
  redirectUri: string;
  onCode: (code: string) => void;
  onCancel: () => void;
}

/** Same OAuth redirect target despite trailing slashes / query-only differences. */
function isOAuthRedirectTo(navUrl: string, redirectUriTemplate: string): boolean {
  try {
    const nav = new URL(navUrl);
    const tmpl = new URL(redirectUriTemplate);
    const norm = (p: string) =>
      (p.endsWith('/') ? p.slice(0, -1) : p) || '/';
    return (
      nav.origin === tmpl.origin &&
      norm(nav.pathname) === norm(tmpl.pathname)
    );
  } catch {
    return navUrl.startsWith(redirectUriTemplate);
  }
}

export function TelegramAuthModal({
  visible,
  authUrl,
  redirectUri,
  onCode,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(true);
  /** Hides WebView the same frame we got the code so the user is not left on Telegram/callback. */
  const [webviewDismissed, setWebviewDismissed] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const codeExtracted = useRef(false);

  useEffect(() => {
    if (visible) {
      setWebviewDismissed(false);
      codeExtracted.current = false;
      setLoading(true);
    }
  }, [visible, authUrl]);

  const handleNavigationChange = useCallback(
    (event: WebViewNavigation) => {
      if (codeExtracted.current) return;

      const url = event.url;
      if (!isOAuthRedirectTo(url, redirectUri)) return;

      codeExtracted.current = true;
      webViewRef.current?.stopLoading();

      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (code) {
          setWebviewDismissed(true);
          setLoading(false);
          onCode(code);
        } else {
          const error = parsed.searchParams.get('error') || 'no_code';
          onCancel();
          console.warn('Telegram auth error:', error);
        }
      } catch {
        onCancel();
      }
    },
    [redirectUri, onCode, onCancel],
  );

  const handleShouldStartLoad = useCallback(
    (event: {url: string}) => {
      if (isOAuthRedirectTo(event.url, redirectUri)) {
        handleNavigationChange(event as WebViewNavigation);
        return false;
      }
      return true;
    },
    [redirectUri, handleNavigationChange],
  );

  const handleLoadEnd = useCallback(() => setLoading(false), []);

  const handleModalHide = useCallback(() => {
    codeExtracted.current = false;
    setWebviewDismissed(false);
    setLoading(true);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
      onDismiss={handleModalHide}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Telegram Login</Text>
          <View style={styles.placeholder} />
        </View>

        {visible && authUrl && !webviewDismissed ? (
          <WebView
            ref={webViewRef}
            source={{uri: authUrl}}
            style={styles.webview}
            onNavigationStateChange={handleNavigationChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onLoadEnd={handleLoadEnd}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled={Platform.OS === 'android'}
            userAgent={
              Platform.OS === 'android'
                ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'
                : undefined
            }
          />
        ) : null}

        {webviewDismissed && visible ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.signingIn}>Signing in…</Text>
          </View>
        ) : null}

        {loading && visible && !webviewDismissed && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: {width: 40, alignItems: 'center'},
  closeText: {fontSize: 20, color: colors.textSecondary},
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {width: 40},
  webview: {flex: 1, backgroundColor: colors.bg},
  loader: {
    ...StyleSheet.absoluteFillObject,
    top: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,15,27,0.92)',
  },
  signingIn: {marginTop: 12, fontSize: 15, color: colors.textSecondary},
});
