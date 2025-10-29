// BSSPlus Platform Main JavaScript
class BSSPlusPlatform {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        this.apiEndpoints = {
            posts: '/api/posts', // GET all, POST new
            post: (id) => `/api/post/${id}`, // GET, PUT, DELETE single post
            search: '/api/search'
        };
        this.init();
    }

    // --- Initialization and Setup ---

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.initializeAnimations();
        this.loadPosts(); // Start by loading data from API
        // this.initParticles(); // Keep this if you have a p5.js setup
    }

    checkAuthentication() {
        // Simple check for login
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

    setupEventListeners() {
        // Event listener for the Add/Edit post form submission
        const postForm = document.getElementById('post-form');
        if (postForm) {
            postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        }

        // Event listener for search/filter input (assuming ID is 'search-input')
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }

    // --- Data (API) Operations ---

    async loadPosts() {
        try {
            // Fetch posts from the API endpoint
            const response = await fetch(this.apiEndpoints.posts);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Assuming the API returns an object with a 'data' array
            this.posts = data.data || data; 
            
            this.renderPosts(this.posts);
            this.showNotification('Posts loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showNotification('Failed to load posts. Check API connection.', 'error');
            // Optionally, render an empty table or an error message here
            this.posts = [];
            this.renderPosts([]); 
        }
    }

    async savePost(postData) {
        const isUpdate = this.currentEditId !== null;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate ? this.apiEndpoints.post(this.currentEditId) : this.apiEndpoints.posts;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || `API error! Status: ${response.status}`);
            }

            const result = await response.json();
            
            this.closeModal();
            // Reload all posts to ensure the table is updated with the new/modified data
            await this.loadPosts(); 
            this.showNotification(`Post ${isUpdate ? 'updated' : 'created'} successfully!`, 'success');

        } catch (error) {
            console.error('Error saving post:', error);
            this.showNotification(`Failed to save post: ${error.message}`, 'error');
        }
    }
    
    async deletePost(id) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(this.apiEndpoints.post(id), {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || `API error! Status: ${response.status}`);
            }
            
            // Reload all posts to update the table
            await this.loadPosts(); 
            this.showNotification('Post deleted successfully.', 'success');

        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification(`Failed to delete post: ${error.message}`, 'error');
        }
    }

    // --- UI/Modal Methods ---

    handlePostSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;
        const tags = document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!title || !category || !content) {
            this.showNotification('Please fill in all required fields.', 'error');
            return;
        }

        const postData = {
            title,
            category,
            content,
            author: localStorage.getItem('bssplus_username') || 'Manager',
            tags,
            // API should handle the date fields
        };
        
        this.savePost(postData);
    }

    renderPosts(posts) {
        const tableBody = document.getElementById('posts-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = ''; // Clear existing rows

        if (posts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No posts found.</td></tr>';
            return;
        }

        posts.forEach(post => {
            const row = tableBody.insertRow();
            row.className = 'border-b border-gray-200 hover:bg-gray-50 transition-colors';

            // Data cells
            row.insertCell().textContent = post.id;
            row.insertCell().textContent = post.title;
            row.insertCell().innerHTML = `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">${post.category}</span>`;
            row.insertCell().textContent = this.formatDate(post.created_date || post.createdDate); // Use fallback for date
            
            // Action button cell - THIS IS THE CRITICAL FIX
            const actionCell = row.insertCell();
            actionCell.className = 'px-6 py-4';
            actionCell.innerHTML = `
                <div class="flex items-center space-x-2">
                    <button onclick="platform.openEditModal(${post.id})"
                            class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        Edit
                    </button>
                    <button onclick="platform.viewPost(${post.id})"
                            class="text-green-600 hover:text-green-900 text-sm font-medium">
                        View
                    </button>
                    <button onclick="platform.deletePost(${post.id})"
                            class="text-red-600 hover:text-red-900 text-sm font-medium">
                        Delete
                    </button>
                </div>
            `;
        });
    }

    openAddModal() {
        this.currentEditId = null;
        document.getElementById('modal-title').textContent = 'Add New Post';
        document.getElementById('post-form').reset();
        document.getElementById('post-modal').classList.remove('hidden');
    }

    openEditModal(id) {
        const post = this.posts.find(p => p.id == id); // Use == for potential type mismatch (string/number)
        if (!post) {
            this.showNotification('Post not found for editing.', 'error');
            return;
        }

        this.currentEditId = id;
        document.getElementById('modal-title').textContent = 'Edit Post';
        
        // Populate form fields
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-category').value = post.category;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-tags').value = (post.tags || []).join(', ');

        document.getElementById('post-modal').classList.remove('hidden');
    }

    viewPost(id) {
        const post = this.posts.find(p => p.id == id);
        if (!post) {
            this.showNotification('Post not found.', 'error');
            return;
        }
        
        // Use a simple alert for viewing, or implement a dedicated view modal
        alert(`Post: ${post.title}\nCategory: ${post.category}\n\nContent:\n${post.content}`);
    }

    closeModal() {
        document.getElementById('post-modal').classList.add('hidden');
        this.currentEditId = null;
    }

    handleSearch(query) {
        const lowerCaseQuery = query.toLowerCase();
        const filteredPosts = this.posts.filter(post => 
            post.title.toLowerCase().includes(lowerCaseQuery) ||
            post.content.toLowerCase().includes(lowerCaseQuery) ||
            post.category.toLowerCase().includes(lowerCaseQuery) ||
            (post.tags || []).some(tag => tag.toLowerCase().includes(lowerCaseQuery))
        );
        this.renderPosts(filteredPosts);
    }
    
    clearFilters() {
        document.getElementById('search-input').value = '';
        this.renderPosts(this.posts);
    }


    // --- Utility Methods ---

    initializeAnimations() {
        // Example Anime.js animation setup
        anime({
            targets: '.animate-in',
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            easing: 'easeOutQuad'
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate notification
        anime({
            targets: notification,
            translateX: [100, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            anime({
                targets: notification,
                translateX: [0, 100],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeInQuart',
                complete: () => notification.remove()
            });
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
// These are necessary because HTML onclick attributes can only easily call global functions
function openAddModal() {
    window.platform.openAddModal();
}

function closeModal() {
    window.platform.closeModal();
}

function clearFilters() {
    window.platform.clearFilters();
}


// Initialize platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // We attach the instance to the window object so it can be accessed by
    // HTML onclick attributes (e.g., in renderPosts and the main button)
    window.platform = new BSSPlusPlatform(); 
});
