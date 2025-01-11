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

        // Get user's stored items
        const { data, error } = await supabase
            .from('stored_items')
            .select('content, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
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
