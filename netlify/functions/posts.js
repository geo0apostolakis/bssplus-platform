const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client using Netlify Environment Variables
// These environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) must be set in your Netlify configuration.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Netlify Handler for all post-related API calls (GET, POST, PUT, DELETE)
exports.handler = async (event) => {
    // The path will be /api/posts or /api/posts/ID
    const { httpMethod, path, body } = event;
    const segments = path.split('/').filter(Boolean); // e.g., ['api', 'posts', '123']
    const id = segments.length > 2 ? segments[segments.length - 1] : null;

    try {
        let responseData = null;
        let responseStatus = 200;

        // ------------------------------------------------------------------
        // R - READ (GET /api/posts OR GET /api/posts/:id)
        // ------------------------------------------------------------------
        if (httpMethod === "GET") {
            if (id) {
                // GET /api/posts/:id (Read single post)
                const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
                if (error) throw error;
                responseData = { success: true, data: data };
            } else {
                // GET /api/posts (Read all posts, sorted by newest)
                const { data, error } = await supabase.from('posts').select('*').order('created_date', { ascending: false });
                if (error) throw error;
                responseData = { success: true, data: data };
            }
        } 
        
        // ------------------------------------------------------------------
        // C - CREATE (POST /api/posts)
        // ------------------------------------------------------------------
        else if (httpMethod === "POST") {
            const postData = JSON.parse(body);
            if (!postData.title || !postData.content) {
                 return { statusCode: 400, body: JSON.stringify({ success: false, details: 'Title and content are required' }) };
            }

            // Insert new post, relying on Supabase to set 'id', 'created_date', etc.
            const { data, error } = await supabase
                .from('posts')
                .insert([{
                    title: postData.title,
                    content: postData.content,
                    category: postData.category || 'general',
                    author: postData.author || 'Manager',
                    status: 'published', // Default to published
                }])
                .select(); // Returns the inserted data

            if (error) throw error;
            responseData = { success: true, data: data[0], message: "Post created successfully." };
            responseStatus = 201; // 201 Created
        }
        
        // ------------------------------------------------------------------
        // U - UPDATE (PUT /api/posts/:id)
        // ------------------------------------------------------------------
        else if (httpMethod === "PUT" && id) {
            const postData = JSON.parse(body);
            // Remove 'id' if present to prevent updating the primary key
            delete postData.id; 

            const { data, error } = await supabase
                .from('posts')
                .update({ 
                    ...postData,
                    modified_date: new Date().toISOString() // Manually update modified date
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            responseData = { success: true, data: data[0], message: `Post ${id} updated.` };
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
                headers: { "Content-Type": "application/json" },
            };
        }

        // Return successful response
        return {
            statusCode: responseStatus,
            headers: { 
                "Content-Type": "application/json",
                // This is crucial for CORS when deployed
                "Access-Control-Allow-Origin": "*", 
            },
            body: JSON.stringify(responseData),
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
            headers: { "Content-Type": "application/json" },
        };
    }
};

