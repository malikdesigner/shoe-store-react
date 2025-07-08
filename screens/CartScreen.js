// screens/CartScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config'; // Fixed import path
import CartItem from '../components/CartItem';
import BottomNavigation from '../components/BottomNavigation';

const CartScreen = ({ onNavigate, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCart();
  }, [user]);

  const loadCart = async () => {
    // Handle both authenticated and guest users
    if (!user) {
      // For guest users, we could implement localStorage-like functionality
      // For now, just show empty cart
      setCartItems([]);
      setLoading(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const cart = userData?.cart || [];

      if (cart.length > 0) {
        const shoeIds = cart.map(item => item.shoeId);
        const shoesQuery = query(
          collection(db, 'shoes'),
          where('__name__', 'in', shoeIds)
        );
        const shoesSnapshot = await getDocs(shoesQuery);
        const shoesData = {};
        shoesSnapshot.docs.forEach(doc => {
          shoesData[doc.id] = { id: doc.id, ...doc.data() };
        });

        const cartWithShoeData = cart.map(cartItem => ({
          ...cartItem,
          shoe: shoesData[cartItem.shoeId]
        })).filter(item => item.shoe); // Filter out items where shoe doesn't exist

        setCartItems(cartWithShoeData);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    }
    setLoading(false);
  };

  const updateCartInFirestore = async (newCart) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to update your cart');
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cart: newCart
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update cart');
    }
    setUpdating(false);
  };

  const updateQuantity = async (shoeId, size, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(shoeId, size);
      return;
    }

    const updatedCart = cartItems.map(item => {
      if (item.shoeId === shoeId && item.size === size) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    setCartItems(updatedCart);
    
    const cartForFirestore = updatedCart.map(({ shoe, ...item }) => item);
    await updateCartInFirestore(cartForFirestore);
  };

  const removeFromCart = async (shoeId, size) => {
    const updatedCart = cartItems.filter(item => 
      !(item.shoeId === shoeId && item.size === size)
    );

    setCartItems(updatedCart);
    
    const cartForFirestore = updatedCart.map(({ shoe, ...item }) => item);
    await updateCartInFirestore(cartForFirestore);
  };

  const clearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setCartItems([]);
            await updateCartInFirestore([]);
          },
        },
      ]
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.shoe.price * item.quantity);
    }, 0);
  };

  const checkout = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to proceed with checkout',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => onNavigate('login') }
        ]
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    Alert.alert(
      'Checkout',
      `Total: $${getTotalPrice().toFixed(2)}\n\nProceed to payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            Alert.alert('Success', 'Order placed successfully! (Demo)');
            setCartItems([]);
            updateCartInFirestore([]);
          },
        },
      ]
    );
  };

  // Show guest cart message for non-authenticated users
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerSubtitle}>Guest Mode</Text>
        </View>

        <View style={styles.guestCartContainer}>
          <Ionicons name="information-circle-outline" size={64} color="#3b82f6" />
          <Text style={styles.guestTitle}>Guest Cart</Text>
          <Text style={styles.guestSubtitle}>
            Your cart items will be saved temporarily. Login to save items permanently and checkout.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.loginButtonText}>Login to Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.browseButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>

        <BottomNavigation onNavigate={onNavigate} currentScreen="cart" user={user} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
        <BottomNavigation onNavigate={onNavigate} currentScreen="cart" user={user} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.headerActions}>
          <Text style={styles.headerSubtitle}>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </Text>
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cart Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {cartItems.length > 0 ? (
          <>
            {cartItems.map((item, index) => (
              <CartItem
                key={`${item.shoeId}-${item.size}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                updating={updating}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>
              Add some shoes to get started
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => onNavigate('home')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Checkout Section */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>${getTotalPrice().toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, updating && styles.disabledButton]}
            onPress={checkout}
            disabled={updating}
          >
            <Text style={styles.checkoutButtonText}>
              {updating ? 'Updating...' : 'Proceed to Checkout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomNavigation onNavigate={onNavigate} currentScreen="cart" user={user} />
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // Notch handling
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  clearText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  guestCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 200,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingTop: 8,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120, // Extra padding for fancy bottom nav
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  checkoutButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;
