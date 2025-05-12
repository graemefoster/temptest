import React from 'react';
import { FlatList, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface MenuItem {
  name: string;
  url?: string | null;
  arguments?: Record<string, any> | null;
}

interface StaticSuggestionsListProps {
  suggestions: MenuItem[];
}

export const StaticSuggestionsList: React.FC<StaticSuggestionsListProps> = ({ suggestions }) => {
  if (!suggestions.length) return null;
  return (
    <View style={{ width: '100%', maxWidth: 400 }}>
      <ThemedText style={{ fontWeight: 'bold', fontSize: 16, marginTop: 16, marginBottom: 4 }}>
        Suggestions
      </ThemedText>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignSelf: 'stretch' }}>
            <ThemedText>{item.name}</ThemedText>
          </View>
        )}
        scrollEnabled={false}
        contentContainerStyle={{ width: '100%', maxWidth: 400 }}
      />
    </View>
  );
};
