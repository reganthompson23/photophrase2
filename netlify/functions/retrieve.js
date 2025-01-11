import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    try {
        const { passphrase } = JSON.parse(event.body);
        
        if (!passphrase) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Passphrase is required' })
            };
        }
        
        // Get all entries for this passphrase, ordered by creation date descending
        const { data, error } = await supabase
            .from('stored_items')
            .select('content, created_at')
            .eq('passphrase', passphrase)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to retrieve data' })
            };
        }

        if (!data || data.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No data found for this passphrase' })
            };
        }

        // Create an object to store the latest version of each word
        const latestImages = {};
        
        // Since we're ordered by created_at DESC, first occurrence of each word is the newest
        data.forEach(item => {
            if (item.content && item.content.images) {
                Object.entries(item.content.images).forEach(([word, image]) => {
                    // Only set if we haven't seen this word yet (since we're going newest to oldest)
                    if (!latestImages[word]) {
                        latestImages[word] = image;
                    }
                });
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                data: { images: latestImages }
            })
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process request' })
        };
    }
};
