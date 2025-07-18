// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import AddShoeScreen from './screens/AddShoeScreen';
import EditShoeScreen from './screens/EditShoeScreen';
import WishlistScreen from './screens/WishlistScreen';
import CartScreen from './screens/CartScreen';
import ProfileScreen from './screens/ProfileScreen';
import CheckoutScreen from './screens/CheckoutScreen';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home'); // Start with home (guest mode)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShoe, setSelectedShoe] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const navigateToScreen = (screen, shoe = null) => {
    setSelectedShoe(shoe);
    setCurrentScreen(screen);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Auth screens
  if (currentScreen === 'home') {
    return <HomeScreen onNavigate={navigateToScreen} user={user} />;
  }
  if (currentScreen === 'login') {
    return <LoginScreen onNavigate={navigateToScreen} />;
  }
  if (currentScreen === 'signup') {
    return <SignupScreen onNavigate={navigateToScreen} />;
  }

  // Main app screens (available to all users including guests)
  if (currentScreen === 'addShoe') {
    return <AddShoeScreen onNavigate={navigateToScreen} user={user} />;
  }
  if (currentScreen === 'editShoe') {
    return <EditShoeScreen onNavigate={navigateToScreen} user={user} shoe={selectedShoe} />;
  }
  if (currentScreen === 'wishlist') {
    return <WishlistScreen onNavigate={navigateToScreen} user={user} />;
  }
  if (currentScreen === 'cart') {
    return <CartScreen onNavigate={navigateToScreen} user={user} />;
  }
  if (currentScreen === 'profile') {
    return <ProfileScreen onNavigate={navigateToScreen} user={user} />;
  }
 if (currentScreen === 'checkout') {
    return <CheckoutScreen onNavigate={navigateToScreen} user={user} />;
  }
  return <HomeScreen onNavigate={navigateToScreen} user={user} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default App;