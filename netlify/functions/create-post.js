// netlify/functions/create-post.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

exports.handler = async (event) => {
    // 1. Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Parse the body data sent from the frontend
        const postData = JSON.parse(event.body);

        // Optional: Basic validation (ensure title and content exist)
        if (!postData.title || !postData.content) {
             return { statusCode: 400, body: JSON.stringify({ error: 'Title and content are required' }) };
        }

        // 3. Perform the INSERT operation on Supabase
        const { data, error } = await supabase
            .from('posts')
            .insert([
                { 
                    title: postData.title,
                    content: postData.content,
                    category: postData.category || 'general', // Use a default if category is missing
                    author: postData.author || 'Manager',
                    // Note: Supabase will set created_date/modified_date automatically if you set up the table with defaults
                }
            ])
            .select(); // Ask for the inserted data back

        if (error) throw error;

        // 4. Return the new post data
        return {
            statusCode: 201, // 201 means "Created"
            body: JSON.stringify({ 
                success: true, 
                data: data[0] // Return the first created item
            }),
        };
    } catch (err) {
        console.error('Supabase Create Error:', err.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Failed to create post' }),
        };
    }
};
