import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  interpolate,
} from 'react-native-reanimated';

type Props = {
  children?: ReactNode;
};

const HEADER_HEIGHT = 250;

export default function ParallaxScrollView({ children }: Props) {
  // Use React.ElementRef to infer the type from Animated.ScrollView
  const scrollRef = useAnimatedRef<React.ElementRef<typeof Animated.ScrollView>>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
        ),
      },
      {
        scale: interpolate(
          scrollOffset.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [2, 1, 1]
        ),
      },
    ],
  }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Animated header */}
        <Animated.View style={[{ height: HEADER_HEIGHT, overflow: 'hidden' }, headerAnimatedStyle]}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>Header</Text>
          </View>
        </Animated.View>
        {/* Content */}
        <View style={{ flex: 1, padding: 32 }}>
          {children || <Text>Content goes here</Text>}
        </View>
      </Animated.ScrollView>
    </View>
  );
}