
// components/CartItem.js (if it doesn't exist, create this file)
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CartItem = ({ item, onUpdateQuantity, onRemove, updating }) => {
  const { shoe, size, quantity } = item;

  if (!shoe) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: shoe.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.brand}>{shoe.brand}</Text>
            <Text style={styles.name} numberOfLines={2}>{shoe.name}</Text>
            <Text style={styles.size}>Size: {size}</Text>
            {shoe.color && (
              <Text style={styles.color}>Color: {shoe.color}</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(shoe.id, size)}
            disabled={updating}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, updating && styles.disabledButton]}
              onPress={() => onUpdateQuantity(shoe.id, size, quantity - 1)}
              disabled={updating || quantity <= 1}
            >
              <Ionicons name="remove" size={16} color="#6b7280" />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>{quantity}</Text>
            
            <TouchableOpacity
              style={[styles.quantityButton, updating && styles.disabledButton]}
              onPress={() => onUpdateQuantity(shoe.id, size, quantity + 1)}
              disabled={updating}
            >
              <Ionicons name="add" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.unitPrice}>${shoe.price} each</Text>
            <Text style={styles.totalPrice}>
              ${(shoe.price * quantity).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  brand: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
    lineHeight: 20,
  },
  size: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  color: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: 12,
    color: '#6b7280',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 2,
  },
});

export default CartItem;