import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Transaction {
    id: string;
    transactionType: string; // e.g. WITHDRAWAL ONLINE, DEPOSIT ONLINE
    description: string; // e.g. 1728990 INTL pookie m
    date: string; // e.g. 26 Feb 2014
    amount: number; // positive for deposit, negative for withdrawal
    balance: number;
}

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        DateFrom: undefined,
        DateTo: undefined,
        AccountId: '',
        CustomerId: '',
        TransactionType: '',
        AmountLowLimit: '',
        AmountHighLimit: '',
    });

    useEffect(() => {
        fetch('http://localhost:5067/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
        })
            .then((res) => res.json())
            .then((data) => setTransactions(data))
            .catch(() => setTransactions([]))
            .finally(() => setLoading(false));
    }, [filters]);

    const renderItem = ({ item }: { item: Transaction }) => (
        <View style={styles.transactionContainer}>
            <View style={{ flex: 1 }}>
                <ThemedText style={styles.typeText}>{item.transactionType} {item.id}</ThemedText>
                <ThemedText style={styles.detailsText}>{item.description}</ThemedText>
                <ThemedText style={styles.dateText}>{new Date(item.date).toDateString()}</ThemedText>
            </View>
            <View style={styles.amountContainer}>
                <ThemedText style={[styles.amountText, { color: item.amount < 0 ? '#8B1A1A' : '#217a2b' }]}>
                    {item.amount !== undefined && item.amount !== null ? (item.amount < 0 ? '-' : '') + '$' + Math.abs(item.amount).toFixed(2) : 'N/A'}
                </ThemedText>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ThemedView style={styles.container}>
                <ThemedText type="title">Transactions</ThemedText>
                <Button title={showFilters ? 'Hide Filters' : 'Filter'} onPress={() => setShowFilters((v) => !v)} />
                {showFilters && (
                    <View style={{ width: '100%', maxWidth: 400, marginVertical: 12, padding: 12, backgroundColor: '#f3f3f3', borderRadius: 8 }}>
                        {/* Date From */}
                        <ThemedText>Date From</ThemedText>
                        <DateTimePicker
                            value={filters.DateFrom ? new Date(filters.DateFrom) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(_, date) => setFilters(f => ({ ...f, DateFrom: date }))}
                        />
                        {/* Date To */}
                        <ThemedText>Date To</ThemedText>
                        <DateTimePicker
                            value={filters.DateTo ? new Date(filters.DateTo) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(_, date) => setFilters(f => ({ ...f, DateTo: date }))}
                        />
                        {/* Account ID */}
                        <ThemedText>Account ID</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.AccountId}
                            onChangeText={v => setFilters(f => ({ ...f, AccountId: v }))}
                            placeholder="Account ID"
                        />
                        {/* Customer ID */}
                        <ThemedText>Customer ID</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.CustomerId}
                            onChangeText={v => setFilters(f => ({ ...f, CustomerId: v }))}
                            placeholder="Customer ID"
                        />
                        {/* Transaction Type */}
                        <ThemedText>Transaction Type</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.TransactionType}
                            onChangeText={v => setFilters(f => ({ ...f, TransactionType: v }))}
                            placeholder="Type (e.g. DEPOSIT)"
                        />
                        {/* Amount Low Limit */}
                        <ThemedText>Amount Low Limit</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.AmountLowLimit}
                            onChangeText={v => setFilters(f => ({ ...f, AmountLowLimit: v }))}
                            placeholder="Min Amount"
                            keyboardType="numeric"
                        />
                        {/* Amount High Limit */}
                        <ThemedText>Amount High Limit</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.AmountHighLimit}
                            onChangeText={v => setFilters(f => ({ ...f, AmountHighLimit: v }))}
                            placeholder="Max Amount"
                            keyboardType="numeric"
                        />
                        <Button title="Apply Filters" onPress={() => setShowFilters(false)} />
                    </View>
                )}
                {loading ? (
                    <ThemedText style={{ marginTop: 24 }}>Loading...</ThemedText>
                ) : (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        contentContainerStyle={{ paddingVertical: 16 }}
                    />
                )}
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
    },
    transactionContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: 340,
        paddingVertical: 8,
    },
    typeText: {
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 2,
    },
    detailsText: {
        fontSize: 13,
        color: '#444',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 13,
        color: '#666',
    },
    amountContainer: {
        alignItems: 'flex-end',
        minWidth: 90,
    },
    amountText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    balanceText: {
        fontSize: 13,
        color: '#444',
    },
    separator: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 2,
        width: 340,
        alignSelf: 'center',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        marginBottom: 12,
    },
});
