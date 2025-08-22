import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { fetchUserAttributes } from "aws-amplify/auth";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Gradient from "../components/gradient";
import "../global.css";

type UserProfile = {
  email?: string;
  given_name?: string;
  family_name?: string;
};

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({});
  const { signOut } = useAuthenticator();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        if (isMounted) setProfile(attrs as unknown as UserProfile);
      } catch (e) {
        // noop; user might not be signed in yet
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Gradient>
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <View style={{ position: "absolute", top: 24, right: 24 }}>
        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          style={{ paddingVertical: 8, paddingHorizontal: 12 }}
        >
          <Text style={{ fontFamily: "Inter_600SemiBold", color: "#FFFFFF" }}>Sign Out</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Text style={{ fontSize: 18, marginBottom: 12 }}>Welcome 👋</Text>
          
          <Text style={{ marginBottom: 4 }}>
            {profile.given_name || ""} {profile.family_name || ""}
          </Text>
          <Text style={{ color: "#FFFFFF" }}>{profile.email || ""}</Text>
          <Link href="/gradient-page" style={{ fontSize: 18, marginBottom: 12, color: '#FFFFFF' }}>Gradient Screen</Link>
          <Link href="/tailw" style={{ fontSize: 18, marginBottom: 12, color: '#FFFFFF' }}>Tailwind Screen</Link>
        </>
        
      )}
    </View>
    </Gradient>
  );
}
