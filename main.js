// BSSPlus Platform Main JavaScript
class BSSPlusPlatform {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        this.apiEndpoints = {
            posts: '/api/posts', // For GET (all) and POST (create)
            post: '/api/post',   // For GET/PUT/DELETE by ID
            search: '/api/search'
        };
        this.init();
    }

    // 1. Initialize function (now async)
    async init() {
        this.checkAuthentication();
        // Load posts from API first, then proceed
        await this.getAllPosts(); 
        this.setupEventListeners();
        this.initializeAnimations();
        this.initParticles();
        this.initializeAPI();
    }

    checkAuthentication() {
        // Check if user is logged in
        if (!localStorage.getItem('bssplus_logged_in') || 
            localStorage.getItem('bssplus_username') !== 'admin') {
            window.location.href = 'login.html';
            return;
        }
    }

    logout() {
        localStorage.removeItem('bssplus_logged_in');
        localStorage.removeItem('bssplus_username');
        window.location.href = 'login.html';
    }

    initializeAPI() {
        // This remains the same, but now these methods call the live API
        window.BSSPlusAPI = {
            getAllPosts: () => this.getAllPosts(),
            getPost: (id) => this.getPost(id),
            searchPosts: (query) => this.searchPosts(query),
            createPost: (data) => this.createPost(data),
            updatePost: (id, data) => this.updatePost(id, data),
            deletePost: (id) => this.deletePost(id),
            getPostsByCategory: (category) => this.getPostsByCategory(category)
        };
    }

    // --- CRUD API METHODS (Now Async) ---

    // 3. Rewritten: Fetch all posts from the Netlify API
    async getAllPosts() {
        this.showNotification('Loading posts...', 'info');
        try {
            const response = await fetch(this.apiEndpoints.posts);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch posts. Status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Assuming your Netlify function returns { data: [posts] }
            this.posts = result.data || []; 
            
            this.renderPosts(this.posts);
            this.showNotification('Posts loaded successfully.', 'success');
            
            return {
                success: true,
                data: this.posts,
                count: this.posts.length,
                timestamp: new Date().toISOString()
            };

        } catch (e) {
            console.error('Error loading posts:', e);
            this.showNotification(`Error loading posts: ${e.message}`, 'error');
            this.renderPosts([]);
            
            return {
                success: false,
                error: e.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    getPost(id) {
        // Remains synchronous for local lookup after fetch
        const post = this.posts.find(p => p.id === parseInt(id));
        if (post) {
            return {
                success: true,
                data: post,
                timestamp: new Date().toISOString()
            };
        }
        return {
            success: false,
            error: 'Post not found',
            timestamp: new Date().toISOString()
        };
    }

    searchPosts(query) {
        // Remains synchronous for local filtering after fetch
        const results = this.posts.filter(post => 
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        return {
            success: true,
            data: results,
            count: results.length,
            query: query,
            timestamp: new Date().toISOString()
        };
    }

    getPostsByCategory(category) {
        // Remains synchronous for local filtering after fetch
        const results = this.posts.filter(post => post.category === category);
        return {
            success: true,
            data: results,
            count: results.length,
            category: category,
            timestamp: new Date().toISOString()
        };
    }

    // 4. Rewritten: Create post via POST API call
    async createPost(data) {
        const url = this.apiEndpoints.posts;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.error || `Failed to create post. Status: ${response.status}`);
            }

            const result = await response.json();
            
            // Re-fetch all posts to update the UI from the database
            await this.getAllPosts(); 

            return {
                success: true,
                data: result.data,
                message: 'Post created successfully',
                timestamp: new Date().toISOString()
            };

        } catch (e) {
            console.error('API Create Error:', e);
            return { success: false, error: e.message, timestamp: new Date().toISOString() };
        }
    }

    // 4. Rewritten: Update post via PUT API call
    async updatePost(id, data) {
        const url = `${this.apiEndpoints.post}/${id}`;
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.error || `Failed to update post. Status: ${response.status}`);
            }

            const result = await response.json();
            
            // Re-fetch all posts to update the UI from the database
            await this.getAllPosts(); 

            return {
                success: true,
                data: result.data,
                message: 'Post updated successfully',
                timestamp: new Date().toISOString()
            };

        } catch (e) {
            console.error('API Update Error:', e);
            return { success: false, error: e.message, timestamp: new Date().toISOString() };
        }
    }

    // 5. Rewritten: Delete post via DELETE API call
    async deletePost(id) {
        if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {
            return { success: false, error: 'Deletion cancelled' };
        }

        this.showNotification(`Deleting post ${id}...`, 'info');

        try {
            const response = await fetch(`${this.apiEndpoints.post}/${id}`, {
                method: 'DELETE',
            });

            if (response.status === 204) { // 204 No Content is standard for success DELETE
                this.showNotification(`Post ${id} deleted successfully!`, 'success');
                // Re-fetch ALL posts to update the view
                await this.getAllPosts(); 

                return {
                    success: true,
                    message: 'Post deleted successfully',
                    timestamp: new Date().toISOString()
                };
            } else {
                // Check for error body
                const errorText = await response.text(); 
                let errorMessage = `Failed to delete post. Status: ${response.status}`;
                try {
                     const errorData = JSON.parse(errorText);
                     errorMessage = errorData.error || errorMessage;
                } catch {}
                throw new Error(errorMessage);
            }

        } catch (e) {
            console.error('API DELETE Error:', e);
            this.showNotification(`Error deleting post: ${e.message}`, 'error');
            return { success: false, error: e.message, timestamp: new Date().toISOString() };
        }
    }

    // 2. Remove the old, conflicting local data
    // Delete the loadSampleData() function entirely! It will be replaced by getAllPosts().
    // You must delete the entire block starting around line 157:
    // loadSampleData() { ... } 
    // ... all the way until line 231 ...
    
    // ...

    setupEventListeners() {
        // ... (This function remains unchanged) ...
    }

    initializeAnimations() {
        // ... (This function remains unchanged) ...
    }

    initParticles() {
        // ... (This function remains unchanged) ...
    }

    renderPosts(postsToRender = this.posts) {
        // ... (This function remains unchanged) ...
    }

    handleSearch(query) {
        // ... (This function remains unchanged) ...
    }

    handleCategoryFilter(category) {
        // ... (This function remains unchanged) ...
    }

    clearFilters() {
        // ... (This function remains unchanged) ...
    }

    openAddModal() {
        // ... (This function remains unchanged) ...
    }

    editPost(id) {
        // ... (This function remains unchanged) ...
    }

    viewPost(id) {
        // ... (This function remains unchanged) ...
    }

    closeModal() {
        // ... (This function remains unchanged) ...
    }

    // 6. Rewritten: Handle form submission to call the new API methods
    async handleFormSubmit(e) {
        e.preventDefault();
        
        // 1. Gather form data
        const formData = {
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            content: document.getElementById('post-content').value,
            tags: document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            // Pass author/status for new posts, or it will be overwritten
            author: localStorage.getItem('bssplus_username') || 'Manager',
            status: 'published'
        };

        // 2. Call the appropriate API method
        this.showNotification(this.currentEditId ? 'Updating post...' : 'Creating new post...', 'info');

        let result;
        try {
            if (this.currentEditId) {
                // Call async updatePost
                result = await this.updatePost(this.currentEditId, formData);
            } else {
                // Call async createPost
                result = await this.createPost(formData);
            }
            
            if (result.success) {
                this.closeModal();
                this.showNotification(result.message, 'success');
            } else {
                // Throwing an error here jumps to the catch block below
                throw new Error(result.error); 
            }

        } catch (e) {
            console.error('Form Submission Error:', e);
            this.showNotification(`Error saving post: ${e.message}`, 'error');
        }
        
        // Removed all local array manipulation and localStorage saving.
    }

    clearForm() {
        // ... (This function remains unchanged) ...
    }

    fillForm(post) {
        // ... (This function remains unchanged) ...
    }

    formatDate(dateString) {
        // ... (This function remains unchanged) ...
    }

    showNotification(message, type = 'info') {
        // ... (This function remains unchanged) ...
    }
}

// Global functions for HTML onclick handlers
function openAddModal() {
    platform.openAddModal();
}

function closeModal() {
    platform.closeModal();
}

function clearFilters() {
    platform.clearFilters();
}

// Initialize platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.platform = new BSSPlusPlatform();
});
