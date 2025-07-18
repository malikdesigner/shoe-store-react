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

const ShoeCard = ({ shoe, onNavigate, currentUserId, userRole }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Determine if user can edit/delete this shoe
  const canEditDelete = () => {
    if (!currentUserId) return false; // Guest users can't edit
    if (userRole === 'admin') return true; // Admin can edit any shoe
    return currentUserId === shoe.sellerId; // Customers can only edit their own shoes
  };

  const handleDelete = () => {
    if (!canEditDelete()) {
      Alert.alert('Permission Denied', 'You can only delete your own shoes');
      return;
    }

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
    if (!canEditDelete()) {
      Alert.alert('Permission Denied', 'You can only edit your own shoes');
      return;
    }
    onNavigate('editShoe', shoe);
  };

  const toggleWishlist = async () => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please login to add to wishlist');
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
    // Allow both logged in users and guests to add to cart
    setIsAddingToCart(true);
    try {
      if (currentUserId) {
        // For logged in users, save to Firestore
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
      } else {
        // For guest users, simulate adding to cart
        Alert.alert('Added to Cart! 🛍️', 
          `${shoe.brand} ${shoe.name} (Size ${size}) has been added to your guest cart.\n\nNote: Guest cart items are temporary. Login to save items permanently.`, [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => onNavigate('cart') },
          { text: 'Checkout Now', onPress: () => onNavigate('checkout') }
        ]);
      }
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

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (shoe.originalPrice && shoe.originalPrice > shoe.price) {
      return Math.round(((shoe.originalPrice - shoe.price) / shoe.originalPrice) * 100);
    }
    return 0;
  };

  const discountPercentage = getDiscountPercentage();

  return (
    <View style={styles.shoeCard}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: shoe.image }} style={styles.shoeImage} />
        
        {/* Wishlist Button - Only for logged in users */}
        {currentUserId && (
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
        )}

        {/* Badges */}
        <View style={styles.badgeContainer}>
          {/* Admin Badge - Only visible to admins */}
          {userRole === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#ffffff" />
              <Text style={styles.badgeText}>Admin View</Text>
            </View>
          )}

          {/* Featured Badge */}
          {shoe.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#ffffff" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}

          {/* Condition Badge */}
          {shoe.condition && (
            <View style={[styles.conditionBadge, getConditionBadgeStyle(shoe.condition)]}>
              <Text style={styles.conditionText}>{shoe.condition}</Text>
            </View>
          )}

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercentage}%</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.shoeInfo}>
        <Text style={styles.shoeBrand}>{shoe.brand}</Text>
        <Text style={styles.shoeName} numberOfLines={2}>{shoe.name}</Text>
        
        {/* Additional Info Row */}
        <View style={styles.infoRow}>
          {shoe.color && (
            <View style={styles.infoItem}>
              <Ionicons name="color-palette-outline" size={12} color="#9ca3af" />
              <Text style={styles.infoText}>{shoe.color}</Text>
            </View>
          )}
          {shoe.category && (
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={12} color="#9ca3af" />
              <Text style={styles.infoText}>{shoe.category}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {shoe.description && (
          <Text style={styles.shoeDescription} numberOfLines={2}>
            {shoe.description}
          </Text>
        )}

        {/* Rating and Price Row */}
        <View style={styles.shoeDetails}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.rating}>{shoe.rating || 0}</Text>
            <Text style={styles.ratingCount}>({shoe.ratingCount || 0})</Text>
          </View>
          <View style={styles.priceContainer}>
            {shoe.originalPrice && shoe.originalPrice > shoe.price && (
              <Text style={styles.originalPrice}>${shoe.originalPrice}</Text>
            )}
            <Text style={styles.price}>${shoe.price}</Text>
          </View>
        </View>

        {/* Sizes */}
        {shoe.sizes && shoe.sizes.length > 0 && (
          <View style={styles.sizesContainer}>
            <Text style={styles.sizesLabel}>Sizes:</Text>
            <Text style={styles.sizesText} numberOfLines={1}>
              {shoe.sizes.slice(0, 4).join(', ')}{shoe.sizes.length > 4 ? '...' : ''}
            </Text>
          </View>
        )}

        {/* Stock Status */}
        <View style={styles.stockContainer}>
          <View style={[styles.stockIndicator, { backgroundColor: shoe.inStock ? '#10b981' : '#ef4444' }]} />
          <Text style={[styles.stockText, { color: shoe.inStock ? '#10b981' : '#ef4444' }]}>
            {shoe.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canEditDelete() ? (
            // Owner/Admin actions - Only show for users who can edit/delete
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
            // Buyer actions - Show for everyone else (customers buying other shoes, guests, etc.)
            <TouchableOpacity
              style={[
                styles.addToCartButton, 
                (isAddingToCart || !shoe.inStock) && styles.disabledButton
              ]}
              onPress={showSizeSelector}
              disabled={isAddingToCart || !shoe.inStock}
            >
              <Ionicons 
                name={shoe.inStock ? "bag-add-outline" : "ban-outline"} 
                size={16} 
                color="#ffffff" 
              />
              <Text style={styles.addToCartText}>
                {isAddingToCart ? 'Adding...' : !shoe.inStock ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seller Info - Show for admin or if not own shoe */}
        {(userRole === 'admin' || currentUserId !== shoe.sellerId) && (
          <View style={styles.sellerInfo}>
            <Ionicons name="person-outline" size={12} color="#9ca3af" />
            <Text style={styles.sellerText}>
              Sold by: {shoe.sellerEmail?.split('@')[0] || 'Seller'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Helper function for condition badge styling
const getConditionBadgeStyle = (condition) => {
  switch (condition) {
    case 'new':
      return { backgroundColor: '#10b981' };
    case 'like-new':
      return { backgroundColor: '#06b6d4' };
    case 'good':
      return { backgroundColor: '#3b82f6' };
    case 'fair':
      return { backgroundColor: '#f59e0b' };
    case 'refurbished':
      return { backgroundColor: '#8b5cf6' };
    default:
      return { backgroundColor: '#6b7280' };
  }
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
    backgroundColor: '#f3f4f6',
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
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  conditionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 2,
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
  infoRow: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 2,
    textTransform: 'capitalize',
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
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 2,
    fontWeight: '500',
  },
  ratingCount: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
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
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sellerText: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 4,
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