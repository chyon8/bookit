import { FontAwesome, Feather } from '@expo/vector-icons';

export const StarIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <FontAwesome name="star" size={size} color={color} className={className} />
);

export const TrashIcon = ({ className, size = 20, color = "white" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="trash-2" size={size} color={color} className={className} />
);

export const BookIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="book" size={size} color={color} className={className} />
);

export const BookOpenIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="book-open" size={size} color={color} className={className} />
);

// Add others as needed matching web names
export const SearchIcon = ({ className, size = 20, color = "gray" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="search" size={size} color={color} className={className} />
);

export const XMarkIcon = ({ className, size = 20, color = "gray" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="x" size={size} color={color} className={className} />
);

export const BookshelfIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="book" size={size} color={color} className={className} />
);

export const ChartBarIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="bar-chart-2" size={size} color={color} className={className} />
);

export const ChatBubbleIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="message-circle" size={size} color={color} className={className} />
);

export const SparklesIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <FontAwesome name="magic" size={size} color={color} className={className} />
);

export const ChevronLeftIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="chevron-left" size={size} color={color} className={className} />
);

export const ChevronRightIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="chevron-right" size={size} color={color} className={className} />
);

export const ChevronDownIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="chevron-down" size={size} color={color} className={className} />
);

export const PencilIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="edit-2" size={size} color={color} className={className} />
);

export const PlusIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="plus" size={size} color={color} className={className} />
);

export const TrendingUpIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="trending-up" size={size} color={color} className={className} />
);

export const CameraIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="camera" size={size} color={color} className={className} />
);

export const PhotoIcon = ({ className, size = 20, color = "black" }: { className?: string; size?: number; color?: string }) => (
  <Feather name="image" size={size} color={color} className={className} />
);
