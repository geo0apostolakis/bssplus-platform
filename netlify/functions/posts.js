const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client using Netlify Environment Variables
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Netlify Handler for all 'posts'-related API calls
exports.handler = async (event) => {
    const { httpMethod, path, body } = event;
    const segments = path.split('/').filter(Boolean); // e.g., ['api', 'posts', '123']
    const id = segments.length > 2 ? segments[segments.length - 1] : null;

    try {
        let responseData = null;
        let responseStatus = 200;

        // Handle CORS OPTIONS preflight requests
        if (httpMethod === "OPTIONS") {
             return {
                statusCode: 204, // No Content
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                body: '',
            };
        }

        // R - READ (GET /api/posts OR GET /api/posts/:id)
        if (httpMethod === "GET") {
            const query = id 
                ? supabase.from('posts').select('*').eq('id', id).single()
                : supabase.from('posts').select('*').order('created_at', { ascending: false });
            
            const { data, error } = await query;
            if (error) throw error;
            responseData = { success: true, data: data };
        } 
        
        // C - CREATE (POST /api/posts)
        else if (httpMethod === "POST" && body) {
            const postData = JSON.parse(body);
            const { data, error } = await supabase.from('posts').insert([postData]).select(); 
            if (error) throw error;
            responseData = { success: true, data: data[0] };
            responseStatus = 201; // Created
        } 
        
        // U - UPDATE (PUT /api/posts/:id)
        else if (httpMethod === "PUT" && id && body) {
            const updateData = JSON.parse(body);
            const { data, error } = await supabase.from('posts').update(updateData).eq('id', id).select(); 
            if (error) throw error;
            responseData = { success: true, data: data[0], message: `Post ${id} updated.` };
        } 
        
        // D - DELETE (DELETE /api/posts/:id)
        else if (httpMethod === "DELETE" && id) {
            const { error } = await supabase.from('posts').delete().eq('id', id);
            if (error) throw error;
            responseData = { success: true, message: `Post ${id} deleted.` };
        } 
        
        // METHOD NOT ALLOWED / BAD REQUEST
        else {
            return {
                statusCode: 405,
                body: JSON.stringify({ success: false, message: "Method Not Allowed or Missing Data/ID" }),
            };
        }

        return {
            statusCode: responseStatus,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", 
            },
            body: JSON.stringify({ ...responseData, timestamp: new Date().toISOString() }),
        };

    } catch (error) {
        console.error("API Error (posts):", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                error: "Internal Server Error", 
                details: error.message 
            }),
        };
    }
};