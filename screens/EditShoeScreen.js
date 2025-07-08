// screens/EditShoeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const EditShoeScreen = ({ onNavigate, user, shoe }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    imageUrl: '',
    description: '',
    condition: 'new',
    category: 'sneakers',
    color: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const availableSizes = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14];
  const conditions = ['new', 'like-new', 'good', 'fair'];
  const categories = ['sneakers', 'boots', 'sandals', 'formal', 'athletic', 'casual'];

  useEffect(() => {
    if (shoe) {
      setFormData({
        name: shoe.name || '',
        brand: shoe.brand || '',
        price: shoe.price?.toString() || '',
        imageUrl: shoe.image || '',
        description: shoe.description || '',
        condition: shoe.condition || 'new',
        category: shoe.category || 'sneakers',
        color: shoe.color || '',
      });
      setSelectedSizes(shoe.sizes || []);
    }
  }, [shoe]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      } else {
        return [...prev, size].sort((a, b) => a - b);
      }
    });
  };

  const handleUpdateShoe = async () => {
    const { name, brand, price, imageUrl } = formData;
    
    if (!name || !brand || !price || !imageUrl) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (selectedSizes.length === 0) {
      Alert.alert('Error', 'Please select at least one size');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'shoes', shoe.id), {
        ...formData,
        price: parseFloat(price),
        image: imageUrl,
        sizes: selectedSizes,
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Shoe updated successfully!');
      onNavigate('home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  if (!shoe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Shoe not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Shoe</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Basic Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shoe Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Air Max 270"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nike"
              value={formData.brand}
              onChangeText={(value) => updateFormData('brand', value)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="150"
                value={formData.price}
                onChangeText={(value) => updateFormData('price', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                placeholder="Black"
                value={formData.color}
                onChangeText={(value) => updateFormData('color', value)}
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      formData.category === category && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('category', category)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.category === category && styles.selectedChipText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Condition Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Condition *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {conditions.map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.chip,
                      formData.condition === condition && styles.selectedChip
                    ]}
                    onPress={() => updateFormData('condition', condition)}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.condition === condition && styles.selectedChipText
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Size Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Available Sizes * ({selectedSizes.length} selected)</Text>
            <View style={styles.sizeGrid}>
              {availableSizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeChip,
                    selectedSizes.includes(size) && styles.selectedSizeChip
                  ]}
                  onPress={() => toggleSize(size)}
                >
                  <Text style={[
                    styles.sizeChipText,
                    selectedSizes.includes(size) && styles.selectedSizeChipText
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Image and Description */}
          <Text style={styles.sectionTitle}>Media & Description</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Image URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/shoe-image.jpg"
              value={formData.imageUrl}
              onChangeText={(value) => updateFormData('imageUrl', value)}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the shoe features, condition, special details, etc."
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.updateButton, loading && styles.disabledButton]}
            onPress={handleUpdateShoe}
            disabled={loading}
          >
            <Text style={styles.updateButtonText}>
              {loading ? 'Updating Shoe...' : 'Update Shoe'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  selectedChipText: {
    color: '#ffffff',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  sizeChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedSizeChip: {
    backgroundColor: '#2563eb',
  },
  sizeChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedSizeChipText: {
    color: '#ffffff',
  },
  updateButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditShoeScreen;