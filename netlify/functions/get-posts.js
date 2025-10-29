// netlify/functions/get-posts.js
// This code fetches your posts from Supabase.

// You must install the supabase-js package for this to work.
// Run: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

// Netlify will automatically load these variables from your settings
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create the Supabase Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

exports.handler = async (event, context) => {
    // 1. Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Query the 'posts' table
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_date', { ascending: false });

        if (error) throw error;

        // 3. Return the data to your frontend as a JSON response
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                // This is important for browser security
                'Access-Control-Allow-Origin': '*' 
            },
            body: JSON.stringify({ 
                success: true, 
                data: posts, 
                count: posts.length, 
            }),
        };
    } catch (err) {
        console.error('Supabase Error:', err.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Failed to fetch posts' }),
        };
    }
};
