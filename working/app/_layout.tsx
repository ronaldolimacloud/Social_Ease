import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react-native";
import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import { Amplify } from "aws-amplify";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Image, Text, TextInput, View } from "react-native";
import outputs from "../amplify_outputs.json";
import "../global.css";


Amplify.configure(outputs);

SplashScreen.preventAutoHideAsync();

function MyHeader() {
  return (
    <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 5 }}>
      <Image
        source={require("../assets/images/logo.png")}
        style={{ width: 120, height: 120 }}
        resizeMode="contain"
        accessible
        accessibilityLabel="App logo"
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  // Set/merge global default fonts and text color once fonts are loaded (resilient to hot reload)
  if (fontsLoaded) {
    const existingTextDefaults = (Text as any).defaultProps || {};
    (Text as any).defaultProps = {
      ...existingTextDefaults,
      style: [existingTextDefaults.style, { fontFamily: "Inter_400Regular", color: "#fff" }],
    };

    const existingInputDefaults = (TextInput as any).defaultProps || {};
    (TextInput as any).defaultProps = {
      ...existingInputDefaults,
      style: [existingInputDefaults.style, { fontFamily: "Inter_400Regular", color: "#fff" }],
    };
  }

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <ThemeProvider
      theme={{
        tokens: {
          colors: {
            // Neutral white/grey scale for accents and controls
            primary: {
              10: "#f5f5f5",
              20: "#e5e5e5",
              40: "#cccccc",
              60: "#999999",
              80: "#666666",
              90: "#4d4d4d",
              100: "#ffffff",
            },
            // Ensure readable text on dark background
            font: {
              primary: "#ffffff",
              secondary: "#d1d1d1",
              tertiary: "#a3a3a3",
            },
            // Fallback background token
            background: {
              primary: "#000000",
            },
          },
        },
      }}
    >
      <Authenticator.Provider>
        <Authenticator
          Container={(props) => (
            
              <Authenticator.Container {...props} style={{ backgroundColor: 'transparent' }} />
            
          )}
          Header={MyHeader}
          // components={{ SignIn: MyCustomSignIn, ... }} // optional per-screen overrides
        >
          <Stack
            screenOptions={({ route }) => ({
              headerShown: route.name === "gradient" ? false : true,
              headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#fff' },
              headerLargeTitleStyle: { fontFamily: 'Inter_600SemiBold', fontWeight: '700', color: '#fff' },
            })}
          />
        </Authenticator>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}
