// components/ShoeFinderModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ShoeFinderModal = ({ visible, onClose, setFilters, uniqueValues }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);

  // Comprehensive shoe question bank
  const questionBank = [
    {
      id: 'activity',
      question: "What activity are these shoes for?",
      icon: 'fitness-outline',
      type: 'single',
      options: [
        { value: 'running', label: '🏃‍♂️ Running & Jogging', filters: { categories: ['running', 'athletic'], styles: ['athletic'] } },
        { value: 'casual', label: '👟 Casual Daily Wear', filters: { styles: ['casual'], categories: ['sneakers', 'casual'] } },
        { value: 'work', label: '👔 Work & Business', filters: { styles: ['formal'], categories: ['dress', 'loafers', 'oxfords'] } },
        { value: 'sports', label: '⚽ Sports & Training', filters: { categories: ['athletic', 'training'], styles: ['athletic'] } },
        { value: 'party', label: '🎉 Party & Events', filters: { styles: ['formal', 'luxury'], categories: ['heels', 'dress'] } }
      ]
    },
    {
      id: 'budget',
      question: "What's your budget range?",
      icon: 'card-outline',
      type: 'single',
      options: [
        { value: 'budget', label: '💰 Under $50', filters: { priceRange: { min: 0, max: 50 } } },
        { value: 'mid', label: '💎 $50 - $100', filters: { priceRange: { min: 50, max: 100 } } },
        { value: 'premium', label: '👑 $100 - $200', filters: { priceRange: { min: 100, max: 200 } } },
        { value: 'luxury', label: '💸 $200+', filters: { priceRange: { min: 200, max: 1000 } } }
      ]
    },
    {
      id: 'style',
      question: "Which style appeals to you most?",
      icon: 'sparkles-outline',
      type: 'multiple',
      options: [
        { value: 'casual', label: '👟 Casual & Comfortable', filters: { styles: ['casual'] } },
        { value: 'athletic', label: '🏃‍♂️ Athletic & Sporty', filters: { styles: ['athletic'] } },
        { value: 'formal', label: '👔 Formal & Professional', filters: { styles: ['formal'] } },
        { value: 'vintage', label: '📻 Vintage & Retro', filters: { styles: ['vintage'] } },
        { value: 'luxury', label: '💎 Luxury & Premium', filters: { styles: ['luxury'] } }
      ]
    },
    {
      id: 'season',
      question: "What season will you mainly wear these?",
      icon: 'partly-sunny-outline',
      type: 'single',
      options: [
        { value: 'summer', label: '☀️ Summer (Breathable)', filters: { seasons: ['summer'], materials: ['mesh', 'canvas'] } },
        { value: 'winter', label: '❄️ Winter (Warm & Dry)', filters: { seasons: ['winter'], materials: ['leather', 'waterproof'] } },
        { value: 'spring', label: '🌸 Spring (Light & Fresh)', filters: { seasons: ['spring'] } },
        { value: 'fall', label: '🍂 Fall (Versatile)', filters: { seasons: ['fall'] } },
        { value: 'all', label: '🌈 All Seasons', filters: { seasons: ['all-season'] } }
      ]
    },
    {
      id: 'gender',
      question: "Who are you shopping for?",
      icon: 'people-outline',
      type: 'single',
      options: [
        { value: 'men', label: '👨 Men', filters: { genders: ['men'] } },
        { value: 'women', label: '👩 Women', filters: { genders: ['women'] } },
        { value: 'unisex', label: '👫 Unisex', filters: { genders: ['unisex'] } },
        { value: 'kids', label: '👶 Kids', filters: { genders: ['kids'], ageGroups: ['child', 'youth'] } }
      ]
    },
    {
      id: 'material',
      question: "What material do you prefer?",
      icon: 'layers-outline',
      type: 'multiple',
      options: [
        { value: 'leather', label: '🐄 Genuine Leather', filters: { materials: ['leather'] } },
        { value: 'canvas', label: '🧵 Canvas & Fabric', filters: { materials: ['canvas', 'fabric'] } },
        { value: 'mesh', label: '🌬️ Breathable Mesh', filters: { materials: ['mesh'] } },
        { value: 'synthetic', label: '🔬 Synthetic Materials', filters: { materials: ['synthetic'] } }
      ]
    },
    {
      id: 'condition',
      question: "What condition are you looking for?",
      icon: 'checkmark-circle-outline',
      type: 'single',
      options: [
        { value: 'new_only', label: '✨ Brand New Only', filters: { conditions: ['new'] } },
        { value: 'like_new', label: '💎 Like New', filters: { conditions: ['new', 'like-new'] } },
        { value: 'good', label: '👍 Good Condition', filters: { conditions: ['new', 'like-new', 'good'] } },
        { value: 'any', label: '🌈 Any Condition', filters: {} }
      ]
    },
    {
      id: 'priority',
      question: "What's most important to you?",
      icon: 'star-outline',
      type: 'single',
      options: [
        { value: 'trending', label: '🔥 What\'s Popular', filters: { featured: true } },
        { value: 'quality', label: '⭐ High Ratings', filters: { rating: 4 } },
        { value: 'availability', label: '✅ Available Now', filters: { inStock: true } },
        { value: 'value', label: '💰 Best Value', filters: { priceRange: { min: 0, max: 100 } } }
      ]
    }
  ];

  useEffect(() => {
    if (visible) {
      // Randomize and select 5 questions each time
      const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, 5));
      setCurrentQuestion(0);
      setAnswers({});
    }
  }, [visible]);

  const handleAnswer = (option) => {
    const newAnswers = { ...answers };
    const question = questions[currentQuestion];
    
    if (question.type === 'multiple') {
      if (!newAnswers[question.id]) {
        newAnswers[question.id] = [];
      }
      
      if (newAnswers[question.id].includes(option.value)) {
        newAnswers[question.id] = newAnswers[question.id].filter(v => v !== option.value);
      } else {
        newAnswers[question.id].push(option.value);
      }
    } else {
      newAnswers[question.id] = option.value;
    }
    
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      applyFilters();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const applyFilters = () => {
    const newFilters = {
      brands: [],
      priceRange: { min: 0, max: 1000 },
      sizes: [],
      conditions: [],
      categories: [],
      colors: [],
      materials: [],
      genders: [],
      ageGroups: [],
      seasons: [],
      styles: [],
      rating: 0,
      featured: false,
      inStock: false,
    };

    // Apply filters based on answers
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      if (question.type === 'multiple' && Array.isArray(answer)) {
        answer.forEach(value => {
          const option = question.options.find(opt => opt.value === value);
          if (option?.filters) {
            mergeFilters(newFilters, option.filters);
          }
        });
      } else {
        const option = question.options.find(opt => opt.value === answer);
        if (option?.filters) {
          mergeFilters(newFilters, option.filters);
        }
      }
    });

    setFilters(newFilters);
    onClose();
  };

  const mergeFilters = (target, source) => {
    Object.entries(source).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        target[key] = [...new Set([...target[key], ...value])];
      } else if (typeof value === 'object' && value !== null) {
        target[key] = { ...target[key], ...value };
      } else if (typeof value === 'boolean') {
        target[key] = value;
      } else {
        target[key] = value;
      }
    });
  };

  if (!visible || questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentQuestion];
  const hasAnswer = currentQ && answers[currentQ.id];
  const canProceed = hasAnswer && (
    currentQ.type !== 'multiple' || 
    (Array.isArray(answers[currentQ.id]) && answers[currentQ.id].length > 0)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Ionicons name="search-outline" size={20} color="#2563eb" />
            <Text style={styles.titleText}>Shoe Finder</Text>
          </View>
          <View style={styles.questionCounter}>
            <Text style={styles.counterText}>
              {currentQuestion + 1}/{questions.length}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { width: `${((currentQuestion + 1) / questions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Question Content */}
        <ScrollView style={styles.questionContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.questionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name={currentQ.icon} size={32} color="#2563eb" />
            </View>
            <Text style={styles.questionText}>{currentQ.question}</Text>
            {currentQ.type === 'multiple' && (
              <Text style={styles.multipleHint}>💡 You can select multiple options</Text>
            )}
          </View>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((option, index) => {
              const isSelected = currentQ.type === 'multiple' 
                ? answers[currentQ.id]?.includes(option.value)
                : answers[currentQ.id] === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                  ]}
                  onPress={() => handleAnswer(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText,
                  ]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && styles.disabledButton]}
            onPress={prevQuestion}
            disabled={currentQuestion === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={currentQuestion === 0 ? "#9ca3af" : "#2563eb"} 
            />
            <Text style={[
              styles.navButtonText,
              currentQuestion === 0 && styles.disabledButtonText
            ]}>
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed && styles.disabledButton
            ]}
            onPress={nextQuestion}
            disabled={!canProceed}
          >
            <Text style={[
              styles.nextButtonText,
              !canProceed && styles.disabledButtonText
            ]}>
              {currentQuestion === questions.length - 1 ? 'Find My Shoes' : 'Next'}
            </Text>
            <Ionicons 
              name={currentQuestion === questions.length - 1 ? "search" : "chevron-forward"} 
              size={20} 
              color={!canProceed ? "#9ca3af" : "#ffffff"} 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  questionCounter: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  multipleHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionsContainer: {
    paddingBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
});

export default ShoeFinderModal;