// components/ShoeCard.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';

const ShoeCard = ({ shoe, onNavigate, currentUserId }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Shoe',
      'Are you sure you want to delete this shoe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'shoes', shoe.id));
              Alert.alert('Success', 'Shoe deleted successfully!');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    onNavigate('editShoe', shoe);
  };

  const toggleWishlist = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login to add to wishlist');
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUserId);
      if (isLiked) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(shoe.id)
        });
        setIsLiked(false);
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(shoe.id)
        });
        setIsLiked(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const addToCart = async (size) => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login to add to cart');
      return;
    }

    setIsAddingToCart(true);
    try {
      const userRef = doc(db, 'users', currentUserId);
      await updateDoc(userRef, {
        cart: arrayUnion({
          shoeId: shoe.id,
          size: size,
          quantity: 1,
          addedAt: new Date()
        })
      });
      Alert.alert('Success', 'Added to cart!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
    setIsAddingToCart(false);
  };

  const showSizeSelector = () => {
    if (!shoe.sizes || shoe.sizes.length === 0) {
      Alert.alert('Error', 'No sizes available');
      return;
    }

    const sizeOptions = shoe.sizes.map(size => ({
      text: `Size ${size}`,
      onPress: () => addToCart(size)
    }));

    Alert.alert(
      'Select Size',
      'Choose your size:',
      [
        ...sizeOptions,
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.shoeCard}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: shoe.image }} style={styles.shoeImage} />
        
        {/* Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={toggleWishlist}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? "#ef4444" : "#6b7280"}
          />
        </TouchableOpacity>

        {/* Condition Badge */}
        {shoe.condition && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{shoe.condition}</Text>
          </View>
        )}
      </View>

      <View style={styles.shoeInfo}>
        <Text style={styles.shoeBrand}>{shoe.brand}</Text>
        <Text style={styles.shoeName} numberOfLines={2}>{shoe.name}</Text>
        
        {shoe.color && (
          <Text style={styles.shoeColor}>{shoe.color}</Text>
        )}

        {shoe.description && (
          <Text style={styles.shoeDescription} numberOfLines={2}>
            {shoe.description}
          </Text>
        )}

        <View style={styles.shoeDetails}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.rating}>{shoe.rating || 0}</Text>
          </View>
          <Text style={styles.price}>${shoe.price}</Text>
        </View>

        {/* Sizes */}
        {shoe.sizes && shoe.sizes.length > 0 && (
          <View style={styles.sizesContainer}>
            <Text style={styles.sizesLabel}>Sizes:</Text>
            <Text style={styles.sizesText} numberOfLines={1}>
              {shoe.sizes.join(', ')}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {currentUserId === shoe.sellerId ? (
            // Owner actions
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
              >
                <Ionicons name="pencil" size={16} color="#2563eb" />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Buyer actions
            <TouchableOpacity
              style={[styles.addToCartButton, isAddingToCart && styles.disabledButton]}
              onPress={showSizeSelector}
              disabled={isAddingToCart}
            >
              <Ionicons name="bag-add-outline" size={16} color="#ffffff" />
              <Text style={styles.addToCartText}>
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shoeCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  shoeImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  shoeInfo: {
    paddingHorizontal: 4,
  },
  shoeBrand: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shoeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
    lineHeight: 20,
  },
  shoeColor: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  shoeDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 16,
  },
  shoeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  sizesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  sizesLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 4,
  },
  sizesText: {
    fontSize: 12,
    color: '#1f2937',
    flex: 1,
  },
  actionButtons: {
    marginTop: 12,
  },
  ownerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginRight: 4,
  },
  editText: {
    fontSize: 12,
    color: '#2563eb',
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  addToCartText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default ShoeCard;