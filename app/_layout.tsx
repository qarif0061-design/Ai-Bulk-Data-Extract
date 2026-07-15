import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/shared/hooks/use-auth';
import { useThemeStore } from '../src/shared/hooks/use-theme';
import { useFeedbackStore } from '../src/shared/hooks/use-feedback';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initAuth, isLoading } = useAuthStore();
  const { mode, loadTheme } = useThemeStore();
  const { loadRating } = useFeedbackStore();

  useEffect(() => {
    loadTheme();
    loadRating();
    const unsubscribe = initAuth();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: mode === 'dark' ? '#0F1117' : '#F5F7FA' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="extraction" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen
            name="results/[jobId]"
            options={{
              headerShown: true,
              headerTitle: 'Results',
              headerTintColor: '#4F6BED',
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
