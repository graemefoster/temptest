import { AiSuggestionsList } from '@/components/AiSuggestionsList';
import { StaticSuggestionsList } from '@/components/StaticSuggestionsList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define MenuItem type
export interface MenuItem {
  name: string;
  url?: string | null;
  arguments?: MenuItemArguments;
}

interface MenuItemArguments {
  request: Record<string, any>;
  suggestedMenuItemName: string;
}

export default function HomeScreen() {
  const [name, setName] = useState<string | null>(null);
  const [input, setInput] = useState('');
  
  // Separate state for AI and static suggestions
  const [aiSuggestions, setAiSuggestions] = useState<MenuItem[]>([]);
  const [staticSuggestions, setStaticSuggestions] = useState<MenuItem[]>([]);
  const [activeButton, setActiveButton] = useState('Top');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5067/me')
      .then((res) => res.json())
      .then((data) => setName(data.name))
      .catch(() => setName(null));
  }, []);

  // Debounced fetch for AI and static suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query: string, activeButtonParam: string) => {
      if (!query) {
        setAiSuggestions([]);
        setStaticSuggestions([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Fetch both in parallel
        const [aiRes, staticRes] = await Promise.all([
          fetch('http://localhost:5067/suggest-menu-items/ai-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query,  activeButton: activeButtonParam }),
          }),
          fetch('http://localhost:5067/suggest-menu-items/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, activeButton: activeButtonParam }),
          })
        ]);
        const suggestions = await Promise.all([aiRes.json(), staticRes.json()]);
        const aiData = suggestions[0];
        const staticData = suggestions[1];

        console.log('AI Suggestions:', JSON.stringify(aiData, null, 2));
        console.log('Static Suggestions:', staticData);

        // Check if the response is valid
        // Parse AI suggestions
        let aiItems: MenuItem[] = [];
        if (Array.isArray(aiData)) {
          aiItems = aiData;
        } else if (Array.isArray(aiData.menuItems)) {
          aiItems = aiData.menuItems;
        }
        // Parse static suggestions
        let staticItems: MenuItem[] = [];
        if (Array.isArray(staticData)) {
          staticItems = staticData;
        } else if (Array.isArray(staticData.menuItems)) {
          staticItems = staticData.menuItems;
        }
        setAiSuggestions(aiItems);
        setStaticSuggestions(staticItems);
      } catch (e) {
        setAiSuggestions([]);
        setStaticSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSuggestions(input, activeButton);
  }, [input, activeButton, fetchSuggestions]);

  // Pulsating Thinking... component
  const [pulse, setPulse] = useState(1);
  useEffect(() => {
    if (!isLoading) return;
    let up = false;
    const interval = setInterval(() => {
      setPulse((prev) => {
        if (prev >= 1.2) up = false;
        if (prev <= 0.8) up = true;
        return up ? prev + 0.04 : prev - 0.04;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">{name ? `Hello ${name}` : 'Hello'}</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Type to search menu items..."
          value={input}
          onChangeText={setInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {/* Row of small buttons - now horizontally scrollable */}
        <View style={{ width: '100%', maxWidth: 400 }}>
          <FlatList
            data={['Top', 'Accounts', 'Payments', 'Transactions', 'Loans']}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.buttonWrapper}>
                <View
                  style={[
                    styles.smallButton,
                    activeButton === item && styles.activeButton,
                  ]}
                >
                  <ThemedText
                    style={activeButton === item ? styles.activeButtonText : undefined}
                    onPress={() => setActiveButton(item)}
                  >
                    {item}
                  </ThemedText>
                </View>
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buttonRow}
          />
        </View>
        {/* Thinking... indicator */}
        {isLoading && (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <ThemedText style={{
              fontSize: 18,
              color: '#888',
              fontWeight: 'bold',
              opacity: 0.8,
              transform: [{ scale: pulse }],
            }}>
              AI is thinking...
            </ThemedText>
          </View>
        )}
        <AiSuggestionsList suggestions={aiSuggestions} />
        <StaticSuggestionsList suggestions={staticSuggestions} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // changed from 'center' to 'flex-start' to align content to the top
    backgroundColor: '#fff',
    padding: 16,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  buttonWrapper: {
    marginHorizontal: 4,
  },
  smallButton: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  activeButton: {
    backgroundColor: 'red',
  },
  activeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  suggestionList: {
    width: '100%',
    maxWidth: 400,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignSelf: 'stretch',
  },
  reactLogo: {
    height: 120,
    width: 120,
    marginBottom: 24,
  },
});

// Note: For TypeScript, run: npm i --save-dev @types/lodash.debounce
