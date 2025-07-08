// components/ShoeCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ShoeCard = ({ shoe }) => {
  return (
    <View style={styles.shoeCard}>
      <Image source={{ uri: shoe.image }} style={styles.shoeImage} />
      <View style={styles.shoeInfo}>
        <Text style={styles.shoeBrand}>{shoe.brand}</Text>
        <Text style={styles.shoeName}>{shoe.name}</Text>
        <View style={styles.shoeDetails}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.rating}>{shoe.rating}</Text>
          </View>
          <Text style={styles.price}>${shoe.price}</Text>
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
  shoeImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
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
});

export default ShoeCard;