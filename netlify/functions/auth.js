const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({
                token: data.session.access_token,
                user: data.user
            })
        };
    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({
                error: error.message || 'Internal server error'
            })
        };
    }
}; 