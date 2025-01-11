import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }
    
    try {
        const { passphrase, data } = JSON.parse(event.body);
        
        if (!passphrase || !data || !data.images) {
            return { 
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }
        // Get just the newest word-image pair
        const newWord = Object.keys(data.images)[Object.keys(data.images).length - 1];
        const newImage = data.images[newWord];

        // Try to find existing row for this word
        const { data: existingData } = await supabase
            .from('stored_items')
            .select()
            .eq('passphrase', passphrase)
            .contains('content', { images: { [newWord]: null } })
            .single();

        if (existingData) {
            // Update existing row with new image
            const { error: updateError } = await supabase
                .from('stored_items')
                .update({
                    content: {
                        images: {
                            [newWord]: newImage
                        }
                    },
                    created_at: new Date().toISOString()
                })
                .eq('id', existingData.id);

            if (updateError) {
                console.error('Update error:', updateError);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Failed to update image' })
                };
            }
        } else {
            // Create new row if word doesn't exist
            const { error: insertError } = await supabase
                .from('stored_items')
                .insert([{
                    passphrase,
                    content: {
                        images: {
                            [newWord]: newImage
                        }
                    },
                    created_at: new Date().toISOString()
                }]);

            if (insertError) {
                console.error('Insert error:', insertError);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Failed to store data' })
                };
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Data stored successfully',
                status: 'success'
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
