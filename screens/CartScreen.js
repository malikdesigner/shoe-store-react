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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import CartItem from '../components/CartItem';
import BottomNavigation from '../components/BottomNavigation';

const GUEST_CART_KEY = 'guestCart';
const GUEST_CART_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const CartScreen = ({ onNavigate, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCart();
  }, [user]);

  // Guest cart management functions
  const saveGuestCart = async (cartData) => {
    try {
      const cartWithTimestamp = {
        items: cartData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartWithTimestamp));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  };

  const loadGuestCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        const now = Date.now();
        
        // Check if cart has expired (2 hours)
        if (now - parsedCart.timestamp > GUEST_CART_EXPIRY) {
          await AsyncStorage.removeItem(GUEST_CART_KEY);
          return [];
        }
        
        return parsedCart.items || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading guest cart:', error);
      return [];
    }
  };

  const clearGuestCart = async () => {
    try {
      await AsyncStorage.removeItem(GUEST_CART_KEY);
    } catch (error) {
      console.error('Error clearing guest cart:', error);
    }
  };

  const addToGuestCart = async (shoeId, size, quantity = 1, shoeData) => {
    try {
      const currentCart = await loadGuestCart();
      const existingItemIndex = currentCart.findIndex(
        item => item.shoeId === shoeId && item.size === size
      );

      let updatedCart;
      if (existingItemIndex >= 0) {
        // Update existing item
        updatedCart = [...currentCart];
        updatedCart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        const newItem = {
          shoeId,
          size,
          quantity,
          shoe: shoeData
        };
        updatedCart = [...currentCart, newItem];
      }

      await saveGuestCart(updatedCart);
      return updatedCart;
    } catch (error) {
      console.error('Error adding to guest cart:', error);
      return [];
    }
  };

  const loadCart = async () => {
    if (!user) {
      // Load guest cart from AsyncStorage
      try {
        const guestCartItems = await loadGuestCart();
        setCartItems(guestCartItems);
      } catch (error) {
        console.error('Error loading guest cart:', error);
        setCartItems([]);
      }
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
        })).filter(item => item.shoe);

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
      // Save to AsyncStorage for guest users
      const cartForStorage = newCart.map(item => ({
        shoeId: item.shoeId,
        size: item.size,
        quantity: item.quantity,
        shoe: item.shoe
      }));
      await saveGuestCart(cartForStorage);
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cart: newCart.map(({ shoe, ...item }) => item)
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
    await updateCartInFirestore(updatedCart);
  };

  const removeFromCart = async (shoeId, size) => {
    const updatedCart = cartItems.filter(item => 
      !(item.shoeId === shoeId && item.size === size)
    );

    setCartItems(updatedCart);
    await updateCartInFirestore(updatedCart);
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
            if (user) {
              await updateCartInFirestore([]);
            } else {
              await clearGuestCart();
            }
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

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    // Allow both users and guests to proceed to checkout
    if (!user) {
      Alert.alert(
        'Guest Checkout',
        'You can checkout as a guest or login to save your information',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Checkout as Guest', onPress: () => onNavigate('checkout') },
          { text: 'Login First', onPress: () => onNavigate('login') }
        ]
      );
      return;
    }

    // Navigate to checkout screen
    onNavigate('checkout');
  };

  // Expose addToGuestCart function globally for use in other screens
  React.useEffect(() => {
    global.addToGuestCart = addToGuestCart;
    global.loadGuestCart = loadGuestCart;
    
    return () => {
      delete global.addToGuestCart;
      delete global.loadGuestCart;
    };
  }, []);

  // Show guest cart interface for non-authenticated users
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.headerActions}>
            <Text style={styles.headerSubtitle}>
              Guest Mode • {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </Text>
            {cartItems.length > 0 && (
              <TouchableOpacity onPress={clearCart}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading cart...</Text>
          </View>
        ) : (
          <>
            {/* Cart Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {cartItems.length > 0 ? (
                <>
                  {/* Guest Info Banner */}
                  <View style={styles.guestBanner}>
                    <Ionicons name="time-outline" size={20} color="#f59e0b" />
                    <Text style={styles.guestBannerText}>
                      Your cart will be saved for 2 hours. Login to save permanently.
                    </Text>
                  </View>

                  {cartItems.map((item, index) => (
                    <CartItem
                      key={`${item.shoeId}-${item.size}`}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      updating={updating}
                    />
                  ))}
                  
                  {/* Shopping Benefits */}
                  <View style={styles.benefitsContainer}>
                    <View style={styles.benefitItem}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
                      <Text style={styles.benefitText}>Secure Checkout</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
                      <Text style={styles.benefitText}>Easy Returns</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="car-outline" size={20} color="#f59e0b" />
                      <Text style={styles.benefitText}>Fast Delivery</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="bag-outline" size={64} color="#3b82f6" />
                  <Text style={styles.guestTitle}>Guest Shopping Cart</Text>
                  <Text style={styles.guestSubtitle}>
                    As a guest, you can add items to your cart and checkout. Your items will be saved for 2 hours.
                  </Text>
                  
                  <View style={styles.guestCartActions}>
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={() => onNavigate('login')}
                    >
                      <Text style={styles.loginButtonText}>Login to Save Cart</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => onNavigate('home')}
                  >
                    <Text style={styles.browseButtonText}>Continue Shopping</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Checkout Section */}
            {cartItems.length > 0 && (
              <View style={styles.checkoutSection}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total ({cartItems.length} items)</Text>
                    <Text style={styles.totalPrice}>${getTotalPrice().toFixed(2)}</Text>
                  </View>
                  <View style={styles.shippingInfo}>
                    <Text style={styles.shippingText}>
                      {getTotalPrice() > 100 ? '🚚 FREE Shipping' : '+ $9.99 Shipping'}
                    </Text>
                    {getTotalPrice() <= 100 && (
                      <Text style={styles.freeShippingTip}>
                        Add ${(100 - getTotalPrice()).toFixed(2)} more for FREE shipping
                      </Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.checkoutButton, updating && styles.disabledButton]}
                  onPress={proceedToCheckout}
                  disabled={updating}
                >
                  <Ionicons name="card-outline" size={20} color="#ffffff" />
                  <Text style={styles.checkoutButtonText}>
                    {updating ? 'Updating...' : 'Checkout as Guest'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

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
            
            {/* Shopping Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
                <Text style={styles.benefitText}>Secure Checkout</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
                <Text style={styles.benefitText}>Easy Returns</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="car-outline" size={20} color="#f59e0b" />
                <Text style={styles.benefitText}>Fast Delivery</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>
              Discover amazing shoes and add them to your cart
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => onNavigate('home')}
            >
              <Ionicons name="storefront-outline" size={20} color="#ffffff" />
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Checkout Section */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutSection}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.totalLabel}>Total ({cartItems.length} items)</Text>
              <Text style={styles.totalPrice}>${getTotalPrice().toFixed(2)}</Text>
            </View>
            <View style={styles.shippingInfo}>
              <Text style={styles.shippingText}>
                {getTotalPrice() > 100 ? '🚚 FREE Shipping' : '+ $9.99 Shipping'}
              </Text>
              {getTotalPrice() <= 100 && (
                <Text style={styles.freeShippingTip}>
                  Add ${(100 - getTotalPrice()).toFixed(2)} more for FREE shipping
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.checkoutButton, updating && styles.disabledButton]}
            onPress={proceedToCheckout}
            disabled={updating}
          >
            <Ionicons name="card-outline" size={20} color="#ffffff" />
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
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
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
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  guestBannerText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
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
  guestCartActions: {
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
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
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
  },
  benefitItem: {
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
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
    lineHeight: 22,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  checkoutSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120, // Extra padding for bottom nav
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  shippingInfo: {
    alignItems: 'flex-end',
  },
  shippingText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 2,
  },
  freeShippingTip: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CartScreen;