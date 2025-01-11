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

        // Sign up the user
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password
        });

        if (signupError) throw signupError;

        // If signup successful, immediately sign them in
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signinError) throw signinError;

        return {
            statusCode: 200,
            body: JSON.stringify({
                token: signinData.session.access_token,
                user: signinData.user
            })
        };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({
                error: error.message || 'Internal server error'
            })
        };
    }
}; 