const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client using Netlify Environment Variables
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Netlify Handler for all post-related API calls
exports.handler = async (event) => {
    // Netlify Redirects (Step 1) ensures /api/posts hits this function
    const { httpMethod, path, body } = event;
    // We expect the path to be either /api/posts or /api/posts/ID (via redirect)
    const segments = path.split('/').filter(Boolean); // ['api', 'posts', '123']
    const id = segments.length > 2 ? segments[segments.length - 1] : null;

    try {
        let responseData = null;

        // ------------------------------------------------------------------
        // R - READ (GET /api/posts OR GET /api/posts/:id)
        // ------------------------------------------------------------------
        if (httpMethod === "GET") {
            if (id) {
                // GET /api/posts/:id
                const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
                if (error) throw error;
                responseData = { success: true, data: data };
            } else {
                // GET /api/posts
                const { data, error } = await supabase.from('posts').select('*').order('created_date', { ascending: false });
                if (error) throw error;
                responseData = { success: true, data: data, count: data.length };
            }
        } 
        
        // ------------------------------------------------------------------
        // C - CREATE (POST /api/posts)
        // ------------------------------------------------------------------
        else if (httpMethod === "POST") {
            const newPostData = JSON.parse(body);
            // Supabase automatically handles 'created_at', 'modified_at' if you set them up
            const { data, error } = await supabase
                .from('posts')
                .insert([newPostData])
                .select(); // Select returns the newly created row
            
            if (error) throw error;
            responseData = { success: true, data: data[0] };
        }
        
        // ------------------------------------------------------------------
        // U - UPDATE (PUT /api/posts/:id)
        // ------------------------------------------------------------------
        else if (httpMethod === "PUT" && id) {
            const updateData = JSON.parse(body);
            updateData.modified_date = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('posts')
                .update(updateData)
                .eq('id', id)
                .select(); 

            if (error) throw error;
            responseData = { success: true, data: data[0] };
        }
        
        // ------------------------------------------------------------------
        // D - DELETE (DELETE /api/posts/:id)
        // ------------------------------------------------------------------
        else if (httpMethod === "DELETE" && id) {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            responseData = { success: true, message: `Post ${id} deleted.` };
        } 
        
        // ------------------------------------------------------------------
        // METHOD NOT ALLOWED
        // ------------------------------------------------------------------
        else {
            return {
                statusCode: 405,
                body: JSON.stringify({ success: false, message: "Method Not Allowed or Missing ID" }),
            };
        }

        return {
            statusCode: httpMethod === "POST" ? 201 : 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Allows your frontend to talk to this API
            },
            body: JSON.stringify({ ...responseData, timestamp: new Date().toISOString() }),
        };

    } catch (error) {
        console.error("API Error:", error.message);
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
