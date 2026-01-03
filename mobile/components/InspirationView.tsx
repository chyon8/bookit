import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CuratedBook, useAladinCuration } from '../hooks/useAladinCuration';
import { useRouter } from 'expo-router';
import { BookWithReview, ReadingStatus, UserBook } from '../hooks/useBooks';
import { useAddBookToLibrary } from '../hooks/useBookData';
import { Feather } from '@expo/vector-icons';
import { CheckIcon } from './Icons';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const MINI_CARD_WIDTH = 100;

const CATEGORIES = [
    { id: 1, name: '국내전체' },
    { id: 50917, name: '소설/시/희곡' }, // Correct ID for Novel/Poetry/Play
    { id: 170, name: '경제경영' },
    { id: 656, name: '인문/교양' },
    { id: 336, name: '자기계발' },
    { id: 1196, name: '여행' },
    { id: 2551, name: '만화' }, // Updated comic code
];

export function InspirationView() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(1);

  const { editorChoice, newSpecial, bestseller } = useAladinCuration(selectedCategoryId);
  const addBookMutation = useAddBookToLibrary();
  
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
     supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const handleBookPress = (book: CuratedBook) => {
    if (book.isInBookshelf && book.review?.book_id) {
         router.push(`/book-record/${book.review.book_id}`);
    } else {
         router.push(`/books/${book.isbn13}`);
    }
  };


  const renderCategoryChips = () => {
      // If content is loading, show skeleton chips
      if (editorChoice.isLoading) {
          return (
              <View style={styles.chipContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                      {[1, 2, 3, 4, 5].map((i) => (
                          <View
                              key={i}
                              style={[
                                  styles.chip,
                                  {
                                      backgroundColor: isDark ? colors.card : '#F8FAFC',
                                      borderColor: 'transparent',
                                      width: 80,
                                      height: 36, // Approximate height of chip
                                      justifyContent: 'center'
                                  }
                              ]}
                          >
                               <View style={{ width: '60%', height: 14, backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 4, alignSelf: 'center' }} />
                          </View>
                      ))}
                  </ScrollView>
              </View>
          );
      }

      return (
        <View style={styles.chipContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[
                            styles.chip, 
                            { 
                                backgroundColor: selectedCategoryId === cat.id ? colors.primary : (isDark ? colors.border : '#F1F5F9'),
                                borderColor: isDark ? colors.border : 'transparent',
                            }
                        ]}
                        onPress={() => setSelectedCategoryId(cat.id)}
                    >
                        <Text style={[
                            styles.chipText, 
                            { 
                                color: selectedCategoryId === cat.id ? '#fff' : colors.text 
                            }
                        ]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
      );
  };

  const renderHeroSection = () => {
    if (editorChoice.isLoading) return <HeroSkeleton />;
    
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 22, marginBottom: 4 }]}>
          편집자의 선택
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginBottom: 16 }]}>
          편집자가 엄선한 이달의 책
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {editorChoice.data?.map((book) => (
            <TouchableOpacity 
                key={book.isbn13} 
                activeOpacity={0.9}
                onPress={() => handleBookPress(book)}
            >
              <View style={[styles.heroCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
                <Image 
                  source={{ uri: book.coverImageUrl }} 
                  style={styles.heroCover}
                  resizeMode="cover"
                />
                <View style={styles.heroContent}>
                  <Text style={[styles.heroBookTitle, { color: colors.text }]} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={[styles.heroBookAuthor, { color: colors.textMuted }]} numberOfLines={1}>
                    {book.author}
                  </Text>
                  <Text style={[styles.heroDesc, { color: colors.textMuted }]} numberOfLines={3}>
                    {book.description || "이 책은..."}
                  </Text>
                </View>
                
                {book.isInBookshelf && (
                     <View style={[styles.alreadyBadge, { backgroundColor: colors.success }]}>
                         <CheckIcon size={12} color="#fff" />
                     </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderNewSection = () => {
      if (newSpecial.isLoading) return <ListSkeleton />;

      return (
        <View style={styles.section}>
           <Text style={[styles.sectionTitle, { color: colors.text }]}>새로 나온 책</Text>
           <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginBottom: 16 }]}>
             이번 주의 새로운 영감
           </Text>
           
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {newSpecial.data?.map((book) => (
                  <TouchableOpacity 
                    key={book.isbn13} 
                    style={styles.miniCard}
                    onPress={() => handleBookPress(book)}
                  >
                      <View style={styles.miniCoverContainer}>
                          <Image source={{ uri: book.coverImageUrl }} style={styles.miniCover} />
                          {book.isInBookshelf && (
                              <View style={styles.miniBadge}>
                                  <CheckIcon size={10} color="#fff" />
                              </View>
                          )}
                      </View>
                      <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
                      <Text style={[styles.miniAuthor, { color: colors.textMuted }]} numberOfLines={1}>{book.author}</Text>
                  </TouchableOpacity>
              ))}
           </ScrollView>
        </View>
      );
  };

  const renderBestsellerSection = () => {
    if (bestseller.isLoading) return <ListSkeleton />;

    return (
        <View style={[styles.section, { marginBottom: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>지금 많이 읽는 책</Text>
             <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginBottom: 16 }]}>
                지금 가장 사랑받는 책들
            </Text>

            {bestseller.data?.map((book, index) => (
                <TouchableOpacity 
                    key={book.isbn13} 
                    style={[styles.rowCard, { borderBottomColor: colors.border }]}
                    onPress={() => handleBookPress(book)}
                >
                    <Image source={{ uri: book.coverImageUrl }} style={styles.rowCover} />
                    <View style={styles.rowContent}>
                        <View style={styles.rowHeader}>
                            <Text style={[styles.rank, { color: colors.primary }]}>{index + 1}</Text>
                            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                                {book.title}
                            </Text>
                        </View>
                        <Text style={[styles.rowAuthor, { color: colors.textMuted }]}>
                            {book.author} · {book.publisher}
                        </Text>
                        <Text style={[styles.rowDesc, { color: colors.textMuted }]} numberOfLines={2}>
                            {book.description}
                        </Text>
                    </View>

                    {book.isInBookshelf && (
                        <CheckIcon size={16} color={colors.success} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
  };

  return (
    <ScrollView 
        contentContainerStyle={[styles.container, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}
        showsVerticalScrollIndicator={false}
    >
        {renderHeroSection()}
        {renderCategoryChips()}
        {renderNewSection()}
        {renderBestsellerSection()}
    </ScrollView>
  );
}

const HeroSkeleton = () => (
    <View style={styles.section}>
        <View style={{ width: 120, height: 24, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
        <View style={{ width: 200, height: 16, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 16 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1,2,3].map(i => (
                <View key={i} style={[styles.heroCard, { backgroundColor: '#fff', marginLeft: i===1?20:16 }]}>
                    <View style={{ width: 120, height: 180, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={{ width: '90%', height: 20, backgroundColor: '#F1F5F9', marginBottom: 8 }} />
                        <View style={{ width: '60%', height: 16, backgroundColor: '#F1F5F9', marginBottom: 16 }} />
                        <View style={{ width: '100%', height: 60, backgroundColor: '#F1F5F9' }} />
                    </View>
                </View>
            ))}
        </ScrollView>
    </View>
);

const ListSkeleton = () => (
    <View style={styles.section}>
        <View style={{ width: 150, height: 24, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 20 }}>
            {[1,2,3,4].map(i => (
                 <View key={i} style={{ width: 100 }}>
                     <View style={{ width: 100, height: 150, backgroundColor: '#F1F5F9', borderRadius: 8, marginBottom: 8 }} />
                     <View style={{ width: 80, height: 12, backgroundColor: '#F1F5F9' }} />
                 </View>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  // Hero Styles
  heroCard: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  heroCover: {
    width: 100,
    height: 150,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  heroContent: {
    flex: 1,
    marginLeft: 16,
    height: 140, 
  },
  heroBookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 22,
  },
  heroBookAuthor: {
    fontSize: 13,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  quickAddBtn: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      elevation: 2,
  },
  // Mini Card Styles (New Section)
  miniCard: {
      width: MINI_CARD_WIDTH,
  },
  miniCoverContainer: {
      position: 'relative',
      marginBottom: 8,
  },
  miniCover: {
      width: MINI_CARD_WIDTH,
      height: MINI_CARD_WIDTH * 1.5,
      borderRadius: 8,
      backgroundColor: '#E2E8F0',
  },
  miniBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: '#22c55e',
      padding: 4,
      borderRadius: 10,
  },
  miniTitle: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 2,
  },
  miniAuthor: {
      fontSize: 11,
  },
  // Row Styles (Bestseller)
  rowCard: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      alignItems: 'center',
  },
  rowCover: {
      width: 50,
      height: 75,
      borderRadius: 4,
      backgroundColor: '#E2E8F0',
  },
  rowContent: {
      flex: 1,
      marginLeft: 16,
      marginRight: 8,
  },
  rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
  },
  rank: {
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8,
      fontStyle: 'italic',
  },
  rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
  },
  rowAuthor: {
      fontSize: 12,
      marginBottom: 4,
  },
  rowDesc: {
      fontSize: 12,
      lineHeight: 16,
  },
  rowAddBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
  },
  // Chip Styles
  chipContainer: {
      marginBottom: 24,
  },
  chipScroll: {
      paddingHorizontal: 20,
      gap: 10,
  },
  chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
  },
  chipText: {
      fontSize: 14,
      fontWeight: '600',
  },
  alreadyBadge: {
      position: 'absolute',
      right: 12,
      bottom: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      elevation: 2,
  }
});
