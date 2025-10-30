const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client using Netlify Environment Variables
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Netlify Handler for all 'interactions'-related API calls
exports.handler = async (event) => {
    const { httpMethod, path, body } = event;
    const segments = path.split('/').filter(Boolean);
    const id = segments.length > 2 ? segments[segments.length - 1] : null;

    try {
        let responseData = null;
        let responseStatus = 200;

        // Handle CORS OPTIONS preflight requests
        if (httpMethod === "OPTIONS") {
             return {
                statusCode: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                body: '',
            };
        }

        // R - READ (GET /api/interactions OR GET /api/interactions/:id)
        if (httpMethod === "GET") {
            const query = id 
                ? supabase.from('interactions').select('*').eq('id', id).single()
                : supabase.from('interactions').select('*').order('created_at', { ascending: false });
            
            const { data, error } = await query;
            if (error) throw error;
            responseData = { success: true, data: data };
        } 
        
        // C - CREATE (POST /api/interactions)
        else if (httpMethod === "POST" && body) {
            const interactionData = JSON.parse(body);
            const { data, error } = await supabase.from('interactions').insert([interactionData]).select(); 
            if (error) throw error;
            responseData = { success: true, data: data[0] };
            responseStatus = 201; // Created
        } 
        
        // U - UPDATE (PUT /api/interactions/:id)
        else if (httpMethod === "PUT" && id && body) {
            const updateData = JSON.parse(body);
            const { data, error } = await supabase.from('interactions').update(updateData).eq('id', id).select(); 
            if (error) throw error;
            responseData = { success: true, data: data[0], message: `Interaction ${id} updated.` };
        } 
        
        // D - DELETE (DELETE /api/interactions/:id)
        else if (httpMethod === "DELETE" && id) {
            const { error } = await supabase.from('interactions').delete().eq('id', id);
            if (error) throw error;
            responseData = { success: true, message: `Interaction ${id} deleted.` };
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
        console.error("API Error (interactions):", error.message);
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