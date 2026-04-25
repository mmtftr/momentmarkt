import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { coerceWidgetNode } from "../genui/widgetSchema";
import type { WidgetNode } from "../genui/widgetSchema";
import { s } from "../styles";

type Props = {
  node: unknown;
  onRedeem: () => void;
};

export function WidgetRenderer({ node, onRedeem }: Props) {
  return <ValidatedWidgetRenderer node={coerceWidgetNode(node)} onRedeem={onRedeem} />;
}

function ValidatedWidgetRenderer({ node, onRedeem }: { node: WidgetNode; onRedeem: () => void }) {
  switch (node.type) {
    case "View":
      return (
        <View style={s(node.className)}>
          {node.children?.map((child, index) => (
            <ValidatedWidgetRenderer key={index} node={child} onRedeem={onRedeem} />
          ))}
        </View>
      );
    case "ScrollView":
      return (
        <ScrollView style={s(node.className)} bounces={false}>
          {node.children?.map((child, index) => (
            <ValidatedWidgetRenderer key={index} node={child} onRedeem={onRedeem} />
          ))}
        </ScrollView>
      );
    case "Text":
      return <Text style={s(node.className)}>{node.text}</Text>;
    case "Image":
      return (
        <Image
          accessibilityLabel={node.accessibilityLabel}
          style={s(node.className) as never}
          resizeMode="cover"
          source={{ uri: node.source }}
        />
      );
    case "Pressable":
      return (
        <Pressable style={s(node.className)} onPress={onRedeem}>
          <Text style={s("text-center text-base font-black text-cocoa")}>{node.text}</Text>
        </Pressable>
      );
  }
}
