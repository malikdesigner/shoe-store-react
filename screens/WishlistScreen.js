// screens/WishlistScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ShoeCard from '../components/ShoeCard';
import BottomNavigation from '../components/BottomNavigation';

const WishlistScreen = ({ onNavigate, user }) => {
  const [wishlistShoes, setWishlistShoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const wishlistIds = userData?.wishlist || [];

      if (wishlistIds.length > 0) {
        const shoesQuery = query(
          collection(db, 'shoes'),
          where('__name__', 'in', wishlistIds)
        );
        const shoesSnapshot = await getDocs(shoesQuery);
        const shoes = shoesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWishlistShoes(shoes);
      } else {
        setWishlistShoes([]);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.headerSubtitle}>
          {wishlistShoes.length} item{wishlistShoes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Wishlist Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {wishlistShoes.length > 0 ? (
          <View style={styles.shoesGrid}>
            {wishlistShoes.map((shoe) => (
              <ShoeCard
                key={shoe.id}
                shoe={shoe}
                onNavigate={onNavigate}
                currentUserId={user?.uid}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtext}>
              Add shoes to your wishlist by tapping the heart icon
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNavigation onNavigate={onNavigate} currentScreen="wishlist" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  shoesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default WishlistScreen;