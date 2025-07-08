// components/BottomNavigation.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNavigation = ({ onNavigate, currentScreen, user }) => {
  const handleNavigation = (screen) => {
    // Check if user needs to be logged in for certain screens
    if (!user && (screen === 'wishlist' || screen === 'profile')) {
      Alert.alert(
        'Login Required',
        `Please login to access your ${screen}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => onNavigate('login') }
        ]
      );
      return;
    }
    
    onNavigate(screen);
  };

  const navItems = [
    { 
      key: 'home', 
      icon: 'home-outline', 
      activeIcon: 'home',
      label: 'Home',
      requiresAuth: false,
      color: '#3b82f6'
    },
    { 
      key: 'wishlist', 
      icon: 'heart-outline', 
      activeIcon: 'heart',
      label: 'Wishlist',
      requiresAuth: true,
      color: '#ef4444'
    },
    { 
      key: 'cart', 
      icon: 'bag-outline', 
      activeIcon: 'bag',
      label: 'Cart',
      requiresAuth: false,
      color: '#10b981'
    },
    { 
      key: user ? 'profile' : 'login', 
      icon: user ? 'person-outline' : 'log-in-outline', 
      activeIcon: user ? 'person' : 'log-in',
      label: user ? 'Profile' : 'Login',
      requiresAuth: false,
      color: '#8b5cf6'
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navContainer}>
        {navItems.map((item, index) => {
          const isActive = currentScreen === item.key;
          const showLoginPrompt = !user && item.requiresAuth;
          
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.activeNavItem]}
              onPress={() => handleNavigation(item.key)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                isActive && { backgroundColor: item.color + '20' }
              ]}>
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={24}
                  color={isActive ? item.color : '#9ca3af'}
                />
                {showLoginPrompt && (
                  <View style={styles.loginIndicator}>
                    <Ionicons name="lock-closed" size={10} color="#ef4444" />
                  </View>
                )}
                {isActive && <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />}
              </View>
              <Text style={[
                styles.navText,
                { color: isActive ? item.color : '#9ca3af' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16, // Extra padding for iPhone home indicator
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    transition: 'all 0.3s ease',
  },
  activeNavItem: {
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  loginIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BottomNavigation;