// BSSPlus Platform Main JavaScript - Now API-Driven
class BSSPlusPlatform {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        this.apiEndpoints = {
            posts: '/api/posts', // Netlify Redirect handles this path
        };
        this.init();
    }

    async init() {
        this.checkAuthentication();
        await this.loadPosts(); // <--- NOW ASYNCHRONOUSLY LOADS FROM API
        this.setupEventListeners();
        this.initializeAnimations();
        this.renderPosts();
        this.initParticles();
        this.initializeAPI();
    }
    
    // ------------------------------------------------------------------
    // API-DRIVEN CRUD METHODS (Supabase via Netlify Function)
    // ------------------------------------------------------------------

    // R - Read All Posts (Load data from API)
    async loadPosts() {
        this.showNotification("Loading posts from BSSPlus API...", 'info');
        try {
            const response = await fetch(this.apiEndpoints.posts);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.posts = result.data;
                this.posts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                this.renderPosts();
                this.showNotification(`Successfully loaded ${this.posts.length} posts from database.`, 'success');
                // Remove old localStorage to ensure database is the source of truth
                localStorage.removeItem('bssplus_posts');
            } else {
                console.error("API Error:", result.error);
                this.showNotification("Could not load posts from API.", 'error');
                this.loadSampleDataFallback(); // Fallback if API fails
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            this.showNotification(`Failed to connect to the content API. Loading fallback data.`, 'error');
            this.loadSampleDataFallback();
        }
    }
    
    // C - Create Post (POST request)
    async createPost(data) {
        const postData = {
            ...data,
            author: localStorage.getItem('bssplus_username') || 'Manager',
        };
        
        try {
            const response = await fetch(this.apiEndpoints.posts, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            // Reload all posts to update the list with the new, confirmed data from the database
            await this.loadPosts(); 
            this.showNotification('Post created successfully and saved to database.', 'success');
            return { success: true, data: result.data };
            
        } catch (error) {
            console.error("Create Post Error:", error);
            this.showNotification(`Failed to create post: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // U - Update Post (PUT request)
    async updatePost(id, data) {
        const endpoint = `${this.apiEndpoints.posts}/${id}`; 
        
        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            
            // Reload all posts to ensure the list is refreshed
            await this.loadPosts(); 
            this.showNotification('Post updated successfully in database.', 'success');
            return { success: true, data: result.data };
            
        } catch (error) {
            console.error("Update Post Error:", error);
            this.showNotification(`Failed to update post: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // D - Delete Post (DELETE request)
    async deletePost(id) {
        const endpoint = `${this.apiEndpoints.posts}/${id}`; 
        
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            
            // Since delete was successful, remove from local array for a fast UI update
            this.posts = this.posts.filter(p => p.id != id); 
            this.renderPosts(); 
            this.showNotification('Post deleted successfully from database.', 'success');
            return { success: true, message: 'Post deleted successfully' };
            
        } catch (error) {
            console.error("Delete Post Error:", error);
            this.showNotification(`Failed to delete post: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // Make form submit handler async to await the API call
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;
        const tagsInput = document.getElementById('post-tags').value;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
        
        const postData = { title, category, content, tags, status: 'published' };

        if (this.currentEditId) {
            await this.updatePost(this.currentEditId, postData);
        } else {
            await this.createPost(postData);
        }

        this.closeModal();
    }
    
    // --- FALLBACK (Old logic renamed) ---
    // The previous loadSampleData is now a fallback in case the API is down
    loadSampleDataFallback() {
        this.posts = [
            { id: 1, title: "Welcome to BSSPlus Platform", category: "announcements", content: "Welcome to our new content management platform...", author: "System Administrator", createdDate: "2024-10-15", modifiedDate: "2024-10-15", tags: ["welcome"], status: "published" },
            { id: 2, title: "Digital Transformation Strategy Guidelines", category: "guidelines", content: "Comprehensive guide to implementing digital transformation...", author: "Digital Strategy Team", createdDate: "2024-10-10", modifiedDate: "2024-10-12", tags: ["strategy"], status: "published" },
            { id: 3, title: "ESPA Programs Update 2024", category: "updates", content: "Latest updates on ESPA (European Structural and Investment Funds) programs...", author: "Funding Advisory Team", createdDate: "2024-10-08", modifiedDate: "2024-10-08", tags: ["funding"], status: "published" },
        ];
        this.renderPosts();
    }

    // --- OTHER METHODS (unchanged) ---
    checkAuthentication() { /* ... */ }
    logout() { /* ... */ }
    // ... all other methods like renderPosts, showNotification, etc. remain the same.
}

// Initialize platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we are on index.html (i.e., we have a dashboard)
    if (document.getElementById('posts-table-body')) {
        window.platform = new BSSPlusPlatform();
    }
});

// Global functions for HTML onclick handlers (keep these outside the class)
function openAddModal() {
    platform.openAddModal();
}

function openEditModal(id) {
    platform.openEditModal(id);
}

function confirmDelete(id) {
    platform.confirmDelete(id);
}

function closeModal() {
    platform.closeModal();
}

function clearFilters() {
    platform.clearFilters();
}
