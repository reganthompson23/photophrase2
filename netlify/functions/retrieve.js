const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
    // Check for authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token and get user data
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError) throw authError;

        // Get user's image-word pairs
        const { data, error } = await supabase
            .from('image_words')
            .select('word, image_url, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Create an object to store the images by word
        const images = {};
        
        // Process the data to map words to images
        data.forEach(item => {
            if (!images[item.word]) {
                images[item.word] = item.image_url;
            }
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ data: { images } })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({
                error: error.message || 'Internal server error'
            })
        };
    }
};
