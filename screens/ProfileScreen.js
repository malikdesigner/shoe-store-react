// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
  Image, // FIXED: Added missing Image import
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config'; // FIXED: Correct import path
import BottomNavigation from '../components/BottomNavigation';

const ProfileScreen = ({ onNavigate, user }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userShoes, setUserShoes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        setEditName(userData?.name || user.displayName || user.email?.split('@')[0] || 'User');
      } else {
        // Create user profile if it doesn't exist
        const defaultProfile = {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'customer',
          createdAt: new Date(),
          cart: [],
          wishlist: [],
        };
        await updateDoc(doc(db, 'users', user.uid), defaultProfile);
        setUserProfile(defaultProfile);
        setEditName(defaultProfile.name);
      }

      // Load user's shoes
      const shoesQuery = query(
        collection(db, 'shoes'),
        where('sellerId', '==', user.uid)
      );
      const shoesSnapshot = await getDocs(shoesQuery);
      const shoes = shoesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserShoes(shoes);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // Navigation will be handled by the auth state change listener in the main app
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName.trim(),
        updatedAt: new Date(),
      });
      setUserProfile(prev => ({ ...prev, name: editName.trim() }));
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
    setUpdating(false);
  };

  const getTotalEarnings = () => {
    return userShoes.reduce((total, shoe) => total + (parseFloat(shoe.price) || 0), 0);
  };

  const getActiveListings = () => {
    return userShoes.filter(shoe => shoe.isActive !== false && shoe.inStock !== false).length;
  };

  // Handle case where user is not logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={styles.guestContainer}>
          <Ionicons name="person-outline" size={64} color="#9ca3af" />
          <Text style={styles.guestTitle}>Profile Access</Text>
          <Text style={styles.guestSubtitle}>
            Please login to view your profile and manage your shoes
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.browseButtonText}>Browse Shoes</Text>
          </TouchableOpacity>
        </View>

        <BottomNavigation onNavigate={onNavigate} currentScreen="profile" user={user} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <BottomNavigation onNavigate={onNavigate} currentScreen="profile" user={user} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#6b7280" />
            </View>
            {userProfile?.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>

          {editing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                editable={!updating}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, updating && styles.disabledButton]}
                  onPress={() => {
                    setEditName(userProfile?.name || '');
                    setEditing(false);
                  }}
                  disabled={updating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, updating && styles.disabledButton]}
                  onPress={saveProfile}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.memberSince}>
                Member since {userProfile?.createdAt?.toDate?.()?.getFullYear() || new Date().getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="pencil" size={16} color="#2563eb" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getActiveListings()}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${getTotalEarnings().toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userProfile?.cart?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Cart Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userProfile?.wishlist?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('addShoe')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#2563eb" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add New Shoe</Text>
              <Text style={styles.actionSubtitle}>List a shoe for sale</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('wishlist')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="heart-outline" size={24} color="#ef4444" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Wishlist</Text>
              <Text style={styles.actionSubtitle}>
                {userProfile?.wishlist?.length || 0} items saved
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('cart')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="bag-outline" size={24} color="#16a34a" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Shopping Cart</Text>
              <Text style={styles.actionSubtitle}>
                {userProfile?.cart?.length || 0} items in cart
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {userProfile?.role === 'admin' && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Admin Panel', 'Admin features coming soon!')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="settings-outline" size={24} color="#f59e0b" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Admin Panel</Text>
                <Text style={styles.actionSubtitle}>Manage platform settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* My Shoes */}
        {userShoes.length > 0 && (
          <View style={styles.shoesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Shoes ({userShoes.length})</Text>
              <TouchableOpacity onPress={() => onNavigate('addShoe')}>
                <Text style={styles.addMoreText}>Add More</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userShoes.map((shoe) => (
                <TouchableOpacity 
                  key={shoe.id} 
                  style={styles.shoePreview}
                  onPress={() => onNavigate('editShoe', shoe)}
                >
                  <Image source={{ uri: shoe.image }} style={styles.shoePreviewImage} />
                  <Text style={styles.shoePreviewName} numberOfLines={1}>
                    {shoe.name}
                  </Text>
                  <Text style={styles.shoePreviewPrice}>${shoe.price}</Text>
                  <View style={styles.shoeStatus}>
                    <View style={[
                      styles.statusIndicator, 
                      { backgroundColor: shoe.inStock !== false ? '#10b981' : '#ef4444' }
                    ]} />
                    <Text style={styles.statusText}>
                      {shoe.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {userShoes.length === 0 && (
          <View style={styles.emptySection}>
            <Ionicons name="storefront-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Shoes Listed</Text>
            <Text style={styles.emptySubtitle}>
              Start selling by adding your first shoe to the marketplace
            </Text>
            <TouchableOpacity
              style={styles.addFirstShoeButton}
              onPress={() => onNavigate('addShoe')}
            >
              <Text style={styles.addFirstShoeText}>Add Your First Shoe</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNavigation onNavigate={onNavigate} currentScreen="profile" user={user} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:20,
    marginBottom:20,
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
  guestContainer: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  logoutText: {
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f9fafb',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editProfileText: {
    color: '#2563eb',
    marginLeft: 4,
    fontWeight: '500',
  },
  editContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  editInput: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  shoesSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMoreText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  shoePreview: {
    width: 120,
    marginRight: 12,
  },
  shoePreviewImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  shoePreviewName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  shoePreviewPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  shoeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptySection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addFirstShoeButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstShoeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ProfileScreen;