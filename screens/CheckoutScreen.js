// screens/CheckoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const GUEST_CART_KEY = 'guestCart';

const CheckoutScreen = ({ onNavigate, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  useEffect(() => {
    loadCartData();
  }, [user]);

  // AsyncStorage helper functions
  const loadGuestCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        const now = Date.now();
        
        // Check if cart has expired (2 hours)
        const GUEST_CART_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
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

  const loadCartData = async () => {
    if (!user) {
      // Guest mode - load from AsyncStorage
      setIsGuestMode(true);
      try {
        const guestCartItems = await loadGuestCart();
        
        if (guestCartItems.length === 0) {
          // If no guest cart, create demo items for testing
          const demoCartItems = [
            {
              shoeId: 'guest-demo-1',
              size: '9',
              quantity: 1,
              shoe: {
                id: 'guest-demo-1',
                name: 'Classic Sneaker',
                brand: 'Demo Brand',
                price: 89.99,
                image: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Demo+Shoe'
              }
            },
            {
              shoeId: 'guest-demo-2',
              size: '10',
              quantity: 1,
              shoe: {
                id: 'guest-demo-2',
                name: 'Running Shoes',
                brand: 'Sports Brand',
                price: 129.99,
                image: 'https://via.placeholder.com/300x200/16a34a/ffffff?text=Running+Shoe'
              }
            }
          ];
          setCartItems(demoCartItems);
        } else {
          setCartItems(guestCartItems);
        }
      } catch (error) {
        console.error('Error loading guest cart:', error);
        // Fallback to demo items
        setCartItems([]);
      }
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const cart = userData?.cart || [];

      if (cart.length === 0) {
        Alert.alert('Empty Cart', 'Your cart is empty', [
          { text: 'OK', onPress: () => onNavigate('cart') }
        ]);
        return;
      }

      // Load shoe details for cart items
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
      
      // Pre-fill user info if available
      setShippingInfo(prev => ({
        ...prev,
        fullName: userData?.name || userData?.displayName || '',
        email: user.email || '',
        phone: userData?.phone || '',
        address: userData?.address || '',
        city: userData?.city || '',
        state: userData?.state || '',
        zipCode: userData?.zipCode || '',
        country: userData?.country || 'USA',
      }));
    } catch (error) {
      console.error('Error loading cart data:', error);
      Alert.alert('Error', 'Failed to load cart data');
    }
    setLoading(false);
  };

  const updateShippingInfo = (field, value) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateCardInfo = (field, value) => {
    let formattedValue = value;
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.substring(0, 19);
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
      }
    }
    
    // Limit CVV to 3-4 digits
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardInfo(prev => ({ ...prev, [field]: formattedValue }));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.shoe.price * item.quantity);
    }, 0);
  };

  const getShippingCost = () => {
    const total = getTotalPrice();
    return total > 100 ? 0 : 9.99; // Free shipping over $100
  };

  const getTaxAmount = () => {
    return getTotalPrice() * 0.08; // 8% tax
  };

  const getFinalTotal = () => {
    return getTotalPrice() + getShippingCost() + getTaxAmount();
  };

  const validateForm = () => {
    const { fullName, email, phone, address, city, state, zipCode } = shippingInfo;
    
    if (!fullName || !email || !phone || !address || !city || !state || !zipCode) {
      Alert.alert('Missing Information', 'Please fill in all shipping information');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (paymentMethod === 'card') {
      const { cardNumber, expiryDate, cvv, cardholderName } = cardInfo;
      
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        Alert.alert('Missing Payment Info', 'Please fill in all card information');
        return false;
      }

      // Basic validation
      if (cardNumber.replace(/\s/g, '').length < 13) {
        Alert.alert('Invalid Card', 'Please enter a valid card number');
        return false;
      }

      if (cvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid CVV');
        return false;
      }
    }

    return true;
  };

  const processOrder = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Create order data
      const orderData = {
        userId: user?.uid || 'guest',
        userEmail: user?.email || shippingInfo.email,
        customerType: user ? 'registered' : 'guest',
        items: cartItems.map(item => ({
          shoeId: item.shoeId,
          shoeName: item.shoe.name,
          shoeBrand: item.shoe.brand,
          shoeImage: item.shoe.image,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.shoe.price,
          totalPrice: item.shoe.price * item.quantity,
        })),
        shippingInfo,
        paymentMethod,
        subtotal: getTotalPrice(),
        shipping: getShippingCost(),
        tax: getTaxAmount(),
        total: getFinalTotal(),
        status: 'confirmed',
        createdAt: new Date(),
        orderNumber,
        estimatedDelivery,
        notes: isGuestMode ? 'Guest order - no user account' : 'Registered user order',
      };

      // For now, just simulate saving the order (you can add actual Firestore saving later)
      console.log('Order placed:', orderData);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear cart after successful order
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            cart: []
          });
        } catch (error) {
          console.error('Error clearing cart:', error);
          // Don't fail the order if cart clearing fails
        }
      } else {
        // Clear guest cart from AsyncStorage
        await clearGuestCart();
      }

      // Show success message
      Alert.alert(
        '🎉 Order Placed Successfully!',
        `Order Number: ${orderNumber}\n\n` +
        `Total: ${getFinalTotal().toFixed(2)}\n` +
        `Payment: ${paymentMethod === 'card' ? 'Credit Card' : paymentMethod === 'paypal' ? 'PayPal' : 'Apple Pay'}\n` +
        `Estimated Delivery: ${estimatedDelivery.toLocaleDateString()}\n\n` +
        `A confirmation email will be sent to ${shippingInfo.email}`,
        [
          {
            text: 'Track Order',
            onPress: () => {
              Alert.alert('Order Tracking', `Your order ${orderNumber} is being prepared for shipment. You'll receive tracking info via email once it ships.`);
            }
          },
          {
            text: 'Continue Shopping',
            onPress: () => onNavigate('home'),
            style: 'default'
          }
        ]
      );

    } catch (error) {
      console.error('Order processing error:', error);
      Alert.alert('Order Failed', 'There was an issue processing your order. Please try again.');
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('cart')}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Checkout</Text>
          {isGuestMode && <Text style={styles.guestLabel}>Guest Checkout</Text>}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Type Banner */}
        {isGuestMode ? (
          <View style={styles.guestBanner}>
            <View style={styles.bannerContent}>
              <Ionicons name="person-outline" size={24} color="#f59e0b" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Guest Checkout</Text>
                <Text style={styles.bannerSubtitle}>
                  You're checking out as a guest. Your cart was saved for 2 hours.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.userBanner}>
            <View style={styles.bannerContent}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Logged In User</Text>
                <Text style={styles.bannerSubtitle}>
                  Your information has been pre-filled from your account.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary ({cartItems.length} items)</Text>
          {cartItems.map((item, index) => (
            <View key={`${item.shoeId}-${item.size}`} style={styles.orderItem}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.shoe.brand} {item.shoe.name}</Text>
                  <Text style={styles.itemDetails}>Size: {item.size} | Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.shoe.price * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.deliveryInfo}>
            <Ionicons name="car-outline" size={16} color="#6b7280" />
            <Text style={styles.deliveryText}>
              Estimated delivery: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.fullName}
                onChangeText={(value) => updateShippingInfo('fullName', value)}
                placeholder="John Doe"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.phone}
                onChangeText={(value) => updateShippingInfo('phone', value)}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, isGuestMode && styles.guestInput]}
              value={shippingInfo.email}
              onChangeText={(value) => updateShippingInfo('email', value)}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isGuestMode} // Only editable for guest users
            />
            {isGuestMode && (
              <Text style={styles.inputNote}>We'll send order confirmation to this email</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.address}
              onChangeText={(value) => updateShippingInfo('address', value)}
              placeholder="123 Main Street"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.city}
                onChangeText={(value) => updateShippingInfo('city', value)}
                placeholder="New York"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginHorizontal: 4 }]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.state}
                onChangeText={(value) => updateShippingInfo('state', value)}
                placeholder="NY"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>ZIP *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.zipCode}
                onChangeText={(value) => updateShippingInfo('zipCode', value)}
                placeholder="10001"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons 
                name="card-outline" 
                size={24} 
                color={paymentMethod === 'card' ? "#2563eb" : "#6b7280"} 
              />
              <Text style={[
                styles.paymentText,
                paymentMethod === 'card' && styles.selectedPaymentText
              ]}>Credit/Debit Card</Text>
              {paymentMethod === 'card' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'paypal' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('paypal')}
            >
              <Ionicons 
                name="logo-paypal" 
                size={24} 
                color={paymentMethod === 'paypal' ? "#2563eb" : "#6b7280"} 
              />
              <Text style={[
                styles.paymentText,
                paymentMethod === 'paypal' && styles.selectedPaymentText
              ]}>PayPal</Text>
              {paymentMethod === 'paypal' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'apple' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('apple')}
            >
              <Ionicons 
                name="logo-apple" 
                size={24} 
                color={paymentMethod === 'apple' ? "#2563eb" : "#6b7280"} 
              />
              <Text style={[
                styles.paymentText,
                paymentMethod === 'apple' && styles.selectedPaymentText
              ]}>Apple Pay</Text>
              {paymentMethod === 'apple' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          </View>

          {/* Card Information */}
          {paymentMethod === 'card' && (
            <View style={styles.cardSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cardholder Name *</Text>
                <TextInput
                  style={styles.input}
                  value={cardInfo.cardholderName}
                  onChangeText={(value) => updateCardInfo('cardholderName', value)}
                  placeholder="John Doe"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Card Number *</Text>
                <TextInput
                  style={styles.input}
                  value={cardInfo.cardNumber}
                  onChangeText={(value) => updateCardInfo('cardNumber', value)}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Expiry Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={cardInfo.expiryDate}
                    onChangeText={(value) => updateCardInfo('expiryDate', value)}
                    placeholder="MM/YY"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>CVV *</Text>
                  <TextInput
                    style={styles.input}
                    value={cardInfo.cvv}
                    onChangeText={(value) => updateCardInfo('cvv', value)}
                    placeholder="123"
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.securityBanner}>
                <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                <Text style={styles.securityText}>Your payment information is secure and encrypted</Text>
              </View>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${getTotalPrice().toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={[styles.priceValue, getShippingCost() === 0 && styles.freeShipping]}>
              {getShippingCost() === 0 ? 'FREE' : `${getShippingCost().toFixed(2)}`}
            </Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax</Text>
            <Text style={styles.priceValue}>${getTaxAmount().toFixed(2)}</Text>
          </View>
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${getFinalTotal().toFixed(2)}</Text>
          </View>

          {getShippingCost() === 0 && (
            <View style={styles.freeShippingBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.freeShippingText}>You qualify for FREE shipping!</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.disabledButton]}
          onPress={processOrder}
          disabled={processing}
        >
          {processing ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.placeOrderText}>Processing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#ffffff" />
              <Text style={styles.placeOrderText}>
                Place Order • ${getFinalTotal().toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  guestLabel: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  guestBanner: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  userBanner: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  deliveryText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  guestInput: {
    backgroundColor: '#f9fafb',
  },
  inputNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  selectedPayment: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  paymentText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
  },
  selectedPaymentText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  cardSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  freeShipping: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  freeShippingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  freeShippingText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 6,
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  placeOrderButton: {
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
  placeOrderText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CheckoutScreen;