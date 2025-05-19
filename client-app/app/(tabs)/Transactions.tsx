import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Transaction {
    id: string;
    transactionType: string;
    merchantName: string;
    date: string;
    amount: number;
    balance: number;
}

interface TransactionFilters {
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    accountId: string;
    customerId: string;
    merchantName: string;
    transactionType: string;
    amountLowLimit: number | null;
    amountHighLimit: number | null;
}

export default function TransactionsScreen() {
    const params = useLocalSearchParams();

    // Helper to get yesterday's date (set to midnight)
    const getYesterday = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // Default filters: yesterday's transactions
    const [filters, setFilters] = useState<TransactionFilters>({
        dateFrom: getYesterday(),
        dateTo: getYesterday(),
        accountId: '',
        customerId: '',
        merchantName: '',
        transactionType: '',
        amountLowLimit: null,
        amountHighLimit: null,
    });

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Update filters if params.filter changes (e.g. on navigation)
    useEffect(() => {
        if (params.filter) {
            const filterParams = JSON.parse(params.filter as string) as TransactionFilters;
            setFilters({ ...filterParams });
            console.log('Updated filters from params:', filterParams);
        }
    }, [params.filter]);

    useEffect(() => {
        setLoading(true);
        console.log('Fetching transactions with filters:', filters);

        fetch('http://localhost:5067/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error('Network response was not ok:' + JSON.stringify(await res.text()));
                }
                const results = res.json();
                return results;
            })
            .then((data) => setTransactions(data))
            .catch(e => {
                console.error('Error fetching transactions:', e);
                setTransactions([]);
            })
            .finally(() => setLoading(false));
    }, [filters]);

    const renderItem = ({ item }: { item: Transaction }) => (
        <View style={styles.transactionContainer}>
            <View style={{ flex: 1 }}>
                <ThemedText style={styles.typeText}>{item.transactionType} {item.id}</ThemedText>
                <ThemedText style={styles.detailsText}>{item.merchantName}</ThemedText>
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
                            value={filters.dateFrom ? new Date(filters.dateFrom) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(_, date) => setFilters(f => ({ ...f, dateFrom: date }))}
                        />
                        {/* Date To */}
                        <ThemedText>Date To</ThemedText>
                        <DateTimePicker
                            value={filters.dateTo ? new Date(filters.dateTo) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(_, date) => setFilters(f => ({ ...f, dateTo: date }))}
                        />
                        {/* Account ID */}
                        <ThemedText>Account ID</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.accountId}
                            onChangeText={v => setFilters(f => ({ ...f, accountId: v }))}
                            placeholder="Account ID"
                        />
                        {/* Customer ID */}
                        <ThemedText>Customer ID</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.customerId}
                            onChangeText={v => setFilters(f => ({ ...f, customerId: v }))}
                            placeholder="Customer ID"
                        />
                        {/* Customer ID */}
                        <ThemedText>Merchant Name</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.merchantName}
                            onChangeText={v => setFilters(f => ({ ...f, merchantName: v }))}
                            placeholder="Merchant Name"
                        />
                        {/* Transaction Type */}
                        <ThemedText>Transaction Type</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.transactionType}
                            onChangeText={v => setFilters(f => ({ ...f, transactionType: v }))}
                            placeholder="Type (e.g. DEPOSIT)"
                        />
                        {/* Amount Low Limit */}
                        <ThemedText>Amount Low Limit</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.amountLowLimit !== null && filters.amountLowLimit !== undefined ? String(filters.amountLowLimit) : ''}
                            onChangeText={v => setFilters(f => ({ ...f, amountLowLimit: v === '' ? null : Number(v) }))}
                            placeholder="Min Amount"
                            keyboardType="numeric"
                        />
                        {/* Amount High Limit */}
                        <ThemedText>Amount High Limit</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={filters.amountHighLimit !== null && filters.amountHighLimit !== undefined ? String(filters.amountHighLimit) : ''}
                            onChangeText={v => setFilters(f => ({ ...f, amountHighLimit: v === '' ? null : Number(v) }))}
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
        backgroundColor: 'red',
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
