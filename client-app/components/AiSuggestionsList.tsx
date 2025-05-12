import React from 'react';
import { FlatList, View } from 'react-native';
import { MenuItem } from '../app/(tabs)/index'; // Assuming MenuItem is defined in a separate file
import { ThemedText } from './ThemedText';

interface AiSuggestionsListProps {
  suggestions: MenuItem[];
}

export const AiSuggestionsList: React.FC<AiSuggestionsListProps> = ({ suggestions }) => {
  if (suggestions.length === 0) return null;
  return (
    <View style={{ width: '100%', maxWidth: 400 }}>
      <ThemedText style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8, marginBottom: 4 }}>
        AI Suggestions
      </ThemedText>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignSelf: 'stretch' }}>
            <ThemedText>{item.arguments!.suggestedMenuItemName}</ThemedText>
          </View>
        )}
        scrollEnabled={false}
        contentContainerStyle={{ width: '100%', maxWidth: 400 }}
      />
    </View>
  );
};
