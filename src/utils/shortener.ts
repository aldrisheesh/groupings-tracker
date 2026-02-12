import { supabase } from './supabase/client';

/**
 * Generate a random short code for URL shortening
 * Uses alphanumeric characters (a-z, A-Z, 0-9) for 8 characters
 * This gives us 62^8 = ~218 trillion possible combinations
 */
export function generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create or retrieve a short URL for a grouping page
 * @param subjectId - The subject ID
 * @param groupingId - The grouping ID
 * @returns The short code for the URL
 */
export async function createShortUrl(subjectId: string, groupingId: string): Promise<string | null> {
    try {
        // First, check if a short URL already exists for this combination
        const { data: existing } = await supabase
            .from('short_urls')
            .select('short_code')
            .eq('subject_id', subjectId)
            .eq('grouping_id', groupingId)
            .single();

        if (existing) {
            return existing.short_code;
        }

        // Generate a unique short code
        let shortCode = generateShortCode();
        let attempts = 0;
        const maxAttempts = 10;

        // Try to insert, regenerate if there's a collision
        while (attempts < maxAttempts) {
            const { data, error } = await supabase
                .from('short_urls')
                .insert({
                    short_code: shortCode,
                    subject_id: subjectId,
                    grouping_id: groupingId,
                })
                .select('short_code')
                .single();

            if (!error) {
                return data.short_code;
            }

            // If it's a unique constraint violation, try again with a new code
            if (error.code === '23505') {
                shortCode = generateShortCode();
                attempts++;
            } else {
                console.error('Error creating short URL:', error);
                return null;
            }
        }

        console.error('Failed to generate unique short code after', maxAttempts, 'attempts');
        return null;
    } catch (error) {
        console.error('Error in createShortUrl:', error);
        return null;
    }
}

/**
 * Retrieve the full URL parameters from a short code
 * @param shortCode - The short code to look up
 * @returns Object with subjectId and groupingId, or null if not found
 */
export async function getFullUrl(shortCode: string): Promise<{ subjectId: string; groupingId: string } | null> {
    try {
        const { data, error } = await supabase
            .from('short_urls')
            .select('subject_id, grouping_id')
            .eq('short_code', shortCode)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            subjectId: data.subject_id,
            groupingId: data.grouping_id,
        };
    } catch (error) {
        console.error('Error in getFullUrl:', error);
        return null;
    }
}
