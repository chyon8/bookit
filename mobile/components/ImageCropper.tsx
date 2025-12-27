import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    runOnJS 
} from 'react-native-reanimated';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useTheme } from '../context/ThemeContext';
import { XMarkIcon } from './Icons';

interface ImageCropperProps {
    imageUri: string;
    onCancel: () => void;
    onCrop: (result: { uri: string; base64?: string }) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Minimum crop size
const MIN_CROP_SIZE = 50;

export function ImageCropper({ imageUri, onCancel, onCrop }: ImageCropperProps) {
    const { colors } = useTheme();
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Crop Dimensions (visual size in px)
    const cropWidth = useSharedValue(SCREEN_WIDTH - 40);
    const cropHeight = useSharedValue((SCREEN_WIDTH - 40) * 1.4);
    
    // Shared Values for Image Transformation
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Initial Setup
    useEffect(() => {
        Image.getSize(imageUri, (w, h) => {
            setImageSize({ width: w, height: h });
        }, (err) => console.error(err));
    }, [imageUri]);

    // Update initial crop size when container is ready
    useEffect(() => {
        if (containerSize && imageSize) {
            // Default: 80% of width, book ratio
            const initialWidth = containerSize.width * 0.8;
            const initialHeight = Math.min(containerSize.height * 0.8, initialWidth * 1.4);
            
            cropWidth.value = initialWidth;
            cropHeight.value = initialHeight;
        }
    }, [containerSize, imageSize]);

    // Image Gestures (Pan & Pinch)
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const composedImageGesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    // Crop Corner Gestures
    // We update cropWidth/Height based on which corner is dragged.
    // For simplicity, we center the crop box. So changing width/height implies growing from center.
    // Actually simpler: Resizing usually moves the edge. 
    // IF we assume Center-Anchored crop box, dragging right edge +10px means width +20px?
    // Or we allow the box to move?
    // Let's implement symmetric resizing for simplicity first (dragging corner expands/shrinks box from center).
    // This pairs well with "Pan Image to Center".
    
    const resizeHandle = (cornerX: number, cornerY: number) => Gesture.Pan()
        .onUpdate((e) => {
            // Symmetric resizing logic
            const deltaX = e.translationX * cornerX; // scale by direction
            const deltaY = e.translationY * cornerY;
            
            // Limit min size
            const newWidth = Math.max(MIN_CROP_SIZE, cropWidth.value + deltaX * 2); // *2 because centered
            const newHeight = Math.max(MIN_CROP_SIZE, cropHeight.value + deltaY * 2);
            
            // Limit max size (container)
            if (containerSize) {
                cropWidth.value = Math.min(newWidth, containerSize.width - 20);
                cropHeight.value = Math.min(newHeight, containerSize.height - 20);
            }
        });

    // We can't use functional shared value updates easily in pure JS unless we use .value inside onUpdate
    // So we need separate gestures for each corner or a unified logic.
    // However, recreating gestures inside render is bad.
    // Let's try to make 4 distinct gesture objects.

    // Using useSharedValue for starting dims to support "drag from current size"
    const startCropWidth = useSharedValue(0);
    const startCropHeight = useSharedValue(0);

    const createResizeGesture = (signX: number, signY: number) => Gesture.Pan()
        .onStart(() => {
            startCropWidth.value = cropWidth.value;
            startCropHeight.value = cropHeight.value;
        })
        .onUpdate((e) => {
            const dX = e.translationX * signX; 
            const dY = e.translationY * signY;
            
            // Symmetric expansion: if I drag right edge by 10, width grows by 20 (10 left, 10 right to keep center)
            const nextWidth = startCropWidth.value + dX * 2;
            const nextHeight = startCropHeight.value + dY * 2;
            
            if (containerSize) {
                cropWidth.value = Math.max(MIN_CROP_SIZE, Math.min(containerSize.width - 20, nextWidth));
                cropHeight.value = Math.max(MIN_CROP_SIZE, Math.min(containerSize.height - 20, nextHeight));
            }
        });

    const topLeftGesture = createResizeGesture(-1, -1);
    const topRightGesture = createResizeGesture(1, -1);
    const bottomLeftGesture = createResizeGesture(-1, 1);
    const bottomRightGesture = createResizeGesture(1, 1);

    const animatedCropStyle = useAnimatedStyle(() => ({
        width: cropWidth.value,
        height: cropHeight.value,
    }));
    
    // Overlay styles
    const animatedOverlayTopStyle = useAnimatedStyle(() => ({
        height: (containerSize?.height ?? 0) / 2 - cropHeight.value / 2,
    }));
    
    const animatedOverlayBottomStyle = useAnimatedStyle(() => ({
        height: (containerSize?.height ?? 0) / 2 - cropHeight.value / 2,
    }));
    
    const animatedOverlayLeftStyle = useAnimatedStyle(() => ({
        top: (containerSize?.height ?? 0) / 2 - cropHeight.value / 2,
        height: cropHeight.value,
        width: (containerSize?.width ?? 0) / 2 - cropWidth.value / 2,
    }));

    const animatedOverlayRightStyle = useAnimatedStyle(() => ({
        top: (containerSize?.height ?? 0) / 2 - cropHeight.value / 2,
        height: cropHeight.value,
        width: (containerSize?.width ?? 0) / 2 - cropWidth.value / 2,
    }));


    const handleCrop = async () => {
        if (!imageSize || !containerSize) return;

        setIsProcessing(true);
        
        try {
            const baseScale = Math.min(containerSize.width / imageSize.width, containerSize.height / imageSize.height);
            const displayedWidth = imageSize.width * baseScale;
            const displayedHeight = imageSize.height * baseScale;

            const finalScale = scale.value;
            
            // Calculate Crop Box relative to Layout Center
            // Crop Box is always centered in Layout.
            // Layout Center is (containerWidth/2, containerHeight/2)
            // Crop Box TopLeft (Layout Coords) = (CW/2 - CropW/2, CH/2 - CropH/2)
            
            // Image Visual Center (Layout Coords) = (CW/2 + TranslateX, CH/2 + TranslateY)
            // Image Visual TopLeft = ImageVisualCenter - (DisplayedW * Scale / 2)
            
            // We want CropBox TopLeft relative to Image Visual TopLeft
            // RelX = CropBoxX - ImageVisualX
            // = (CW/2 - CW_box/2) - ( (CW/2 + TransX) - (DispW * Scale / 2) )
            // = -CW_box/2 - TransX + DispW * Scale / 2
            
            // Divide by Scale to get coords in Unscaled Displayed Image
            // X_unscaled = RelX / Scale
            // = (-CW_box/2 - TransX)/Scale + DispW/2
            
            const currentCropW = cropWidth.value;
            const currentCropH = cropHeight.value;
            
            const cropX_in_view = (displayedWidth / 2) + (-currentCropW/2 - translateX.value) / finalScale;
            const cropY_in_view = (displayedHeight / 2) + (-currentCropH/2 - translateY.value) / finalScale;
            const cropW_in_view = currentCropW / finalScale;
            const cropH_in_view = currentCropH / finalScale;
            
            const originX = cropX_in_view / baseScale;
            const originY = cropY_in_view / baseScale;
            const width = cropW_in_view / baseScale;
            const height = cropH_in_view / baseScale;
            
            const result = await manipulateAsync(
                imageUri,
                [
                    {
                        crop: {
                            originX: Math.max(0, originX),
                            originY: Math.max(0, originY),
                            width: width,
                            height: height
                        }
                    }
                ],
                { compress: 1, format: SaveFormat.JPEG, base64: true }
            );
            
            onCrop({ uri: result.uri, base64: result.base64 });
            
        } catch (e) {
            console.error(e);
            alert('크롭 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageSize) return <View style={[styles.container, { backgroundColor: '#000' }]} />;

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <View 
                style={styles.cropAreaContainer} 
                onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
            >
                {containerSize && (
                    <GestureDetector gesture={composedImageGesture}>
                        <Animated.View style={[styles.imageWrapper, animatedImageStyle]}>
                              <Image 
                                source={{ uri: imageUri }} 
                                style={{
                                    width: imageSize.width * Math.min(containerSize.width / imageSize.width, containerSize.height / imageSize.height),
                                    height: imageSize.height * Math.min(containerSize.width / imageSize.width, containerSize.height / imageSize.height)
                                }}
                             />
                        </Animated.View>
                    </GestureDetector>
                )}
                
                {/* Overlay with Holes */}
                {containerSize && (
                    <View style={styles.overlayContainer} pointerEvents="box-none">
                         {/* Top Shade */}
                         <Animated.View style={[styles.overlayShade, { top: 0, width: '100%' }, animatedOverlayTopStyle]} />
                         {/* Bottom Shade */}
                         <Animated.View style={[styles.overlayShade, { bottom: 0, width: '100%' }, animatedOverlayBottomStyle]} />
                         {/* Left Shade */}
                         <Animated.View style={[styles.overlayShade, { left: 0 }, animatedOverlayLeftStyle]} />
                         {/* Right Shade */}
                         <Animated.View style={[styles.overlayShade, { right: 0 }, animatedOverlayRightStyle]} />

                         {/* Crop Frame & Handles */}
                         <View style={styles.centerFrameContainer} pointerEvents="box-none">
                             <Animated.View style={[styles.cropFrame, animatedCropStyle]}>
                                 <GestureDetector gesture={topLeftGesture}>
                                     <View style={[styles.corner, styles.topLeft, { padding: 10, margin: -10 }]} /> 
                                     {/* Increased hit slop via padding/margin trick or just larger view */}
                                 </GestureDetector>
                                 <GestureDetector gesture={topRightGesture}>
                                     <View style={[styles.corner, styles.topRight, { padding: 10, margin: -10 }]} />
                                 </GestureDetector>
                                 <GestureDetector gesture={bottomLeftGesture}>
                                     <View style={[styles.corner, styles.bottomLeft, { padding: 10, margin: -10 }]} />
                                 </GestureDetector>
                                 <GestureDetector gesture={bottomRightGesture}>
                                     <View style={[styles.corner, styles.bottomRight, { padding: 10, margin: -10 }]} />
                                 </GestureDetector>
                             </Animated.View>
                         </View>
                    </View>
                )}
            </View>

            <View style={[styles.controls, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={onCancel} style={styles.button}>
                    <Text style={{ color: colors.text }}>취소</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                        모서리를 드래그하여 조절하세요
                    </Text>
                </View>
                <TouchableOpacity onPress={handleCrop} disabled={isProcessing} style={styles.button}>
                    {isProcessing ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>완료</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cropAreaContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imageWrapper: {
        // alignSelf: 'center',
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayShade: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    centerFrameContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cropFrame: {
        borderWidth: 1,
        borderColor: '#fff',
        backgroundColor: 'transparent',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 34,
    },
    button: {
        padding: 8,
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: 'white',
        borderWidth: 3,
        zIndex: 10,
        backgroundColor: 'transparent', // Ensure it captures touches
    },
    topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
});
