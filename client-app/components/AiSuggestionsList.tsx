import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, View } from 'react-native';
import { MenuItem } from '../app/(tabs)/index'; // Assuming MenuItem is defined in a separate file
import { ThemedText } from './ThemedText';

interface AiSuggestionsListProps {
  suggestions: MenuItem[];
}

export const AiSuggestionsList: React.FC<AiSuggestionsListProps> = ({ suggestions }) => {
  const router = useRouter();

  const handlePress = (item: MenuItem) => {
    console.log('Navigating to:', item);
    if (item.name === 'Transaction Search' && item.arguments?.request) {
      // Navigate to Transactions tab and pass filter params
      router.push({
        pathname: '/(tabs)/Transactions',
        params: { filter: JSON.stringify(item.arguments.request) },
      });
    }
  };

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
            <ThemedText onPress={() => handlePress(item)} style={{ color: item.url === 'CallTransactionSearchApi' ? '#217a2b' : undefined }}>
              {item.arguments!.suggestedMenuItemName}
            </ThemedText>
          </View>
        )}
        scrollEnabled={false}
        contentContainerStyle={{ width: '100%', maxWidth: 400 }}
      />
    </View>
  );
};
