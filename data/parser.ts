
import { BookWithReview, ReadingStatus } from '../types';

const mapNotionStatusToReadingStatus = (notionStatus: string): ReadingStatus => {
    switch (notionStatus) {
        case 'Finished':
            return ReadingStatus.Finished;
        case 'Dropped':
            return ReadingStatus.Dropped;
        case 'Reading': // Assuming this might exist
             return ReadingStatus.Reading;
        default:
            return ReadingStatus.WantToRead;
    }
};

export const parseNotionData = (data: any[]): BookWithReview[] => {
    return data.map(page => {
        const props = page.properties;

        const title = props.Name?.title?.[0]?.plain_text || 'Untitled';
        const author = props.Author?.select?.name || 'Unknown Author';
        const category = props.Tags?.multi_select?.[0]?.name || 'Uncategorized';
        const coverImageUrl = props.표지?.url || `https://picsum.photos/seed/${page.id}/300/450`;
        const description = ''; // No description field in Notion data
        
        const status = mapNotionStatusToReadingStatus(props.상태?.status?.name || '');
        const rating = props['Rating out of 5']?.number || 0;
        const dateReadRaw = props.날짜?.created_time;
        const dateRead = dateReadRaw ? new Date(dateReadRaw).toISOString().split('T')[0] : undefined;

        const notes = props.비고?.rich_text?.map((rt: any) => rt.plain_text).join('\n') || '';

        const book: BookWithReview = {
            id: page.id,
            title,
            author,
            category,
            coverImageUrl,
            description,
            review: {
                status,
                rating,
                dateRead,
                notes: notes.trim(),
            }
        };

        return book;
    });
};
