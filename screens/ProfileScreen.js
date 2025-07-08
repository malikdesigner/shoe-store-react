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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../App';
import BottomNavigation from '../components/BottomNavigation';

const ProfileScreen = ({ onNavigate, user }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userShoes, setUserShoes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      setUserProfile(userData);
      setEditName(userData?.name || '');

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
            } catch (error) {
              Alert.alert('Error', error.message);
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

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName.trim(),
        updatedAt: new Date(),
      });
      setUserProfile(prev => ({ ...prev, name: editName.trim() }));
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getTotalEarnings = () => {
    return userShoes.reduce((total, shoe) => total + shoe.price, 0);
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#6b7280" />
            </View>
          </View>

          {editing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditName(userProfile?.name || '');
                    setEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveProfile}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
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
            <Text style={styles.statNumber}>{userShoes.length}</Text>
            <Text style={styles.statLabel}>Shoes Listed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${getTotalEarnings()}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userProfile?.cart?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Cart Items</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('addShoe')}
          >
            <View style={styles.actionIcon}>
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
            <View style={styles.actionIcon}>
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
            <View style={styles.actionIcon}>
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
        </View>

        {/* My Shoes */}
        {userShoes.length > 0 && (
          <View style={styles.shoesSection}>
            <Text style={styles.sectionTitle}>My Shoes ({userShoes.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userShoes.map((shoe) => (
                <View key={shoe.id} style={styles.shoePreview}>
                  <Image source={{ uri: shoe.image }} style={styles.shoePreviewImage} />
                  <Text style={styles.shoePreviewName} numberOfLines={1}>
                    {shoe.name}
                  </Text>
                  <Text style={styles.shoePreviewPrice}>${shoe.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNavigation onNavigate={onNavigate} currentScreen="profile" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f9fafb',
  },
  avatarContainer: {
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
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
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
    fontSize: 14,
    color: '#6b7280',
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
  shoePreview: {
    width: 120,
    marginRight: 12,
  },
  shoePreviewImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  shoePreviewName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  shoePreviewPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ProfileScreen