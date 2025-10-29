// BSSPlus Platform API
// This file can be used as a Node.js/Express API endpoint

class BSSPlusAPI {
    constructor() {
        this.posts = [];
        this.loadData();
    }

    loadData() {
        // Load from localStorage or use sample data
        const stored = localStorage.getItem('bssplus_posts');
        if (stored) {
            this.posts = JSON.parse(stored);
        } else {
            this.loadSampleData();
        }
    }

    loadSampleData() {
        this.posts = [
            {
                id: 1,
                title: "Welcome to BSSPlus Platform",
                category: "announcements",
                content: "Welcome to our new content management platform! This system allows you to create, manage, and organize all your business content efficiently.",
                author: "System Administrator",
                createdDate: "2024-10-15",
                modifiedDate: "2024-10-15",
                tags: ["welcome", "platform", "introduction"],
                status: "published"
            },
            {
                id: 2,
                title: "Digital Transformation Strategy Guidelines",
                category: "guidelines",
                content: "Comprehensive guide to implementing digital transformation in your organization.",
                author: "Digital Strategy Team",
                createdDate: "2024-10-10",
                modifiedDate: "2024-10-12",
                tags: ["digital transformation", "strategy", "guidelines"],
                status: "published"
            }
        ];
    }

    // API Methods
    getAllPosts() {
        return {
            success: true,
            data: this.posts,
            count: this.posts.length,
            timestamp: new Date().toISOString()
        };
    }

    getPost(id) {
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

    createPost(data) {
        const newPost = {
            id: Date.now(),
            ...data,
            author: data.author || 'API User',
            createdDate: new Date().toISOString().split('T')[0],
            modifiedDate: new Date().toISOString().split('T')[0],
            status: 'published'
        };
        
        this.posts.unshift(newPost);
        localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
        
        return {
            success: true,
            data: newPost,
            message: 'Post created successfully',
            timestamp: new Date().toISOString()
        };
    }

    updatePost(id, data) {
        const postIndex = this.posts.findIndex(p => p.id === parseInt(id));
        if (postIndex !== -1) {
            this.posts[postIndex] = {
                ...this.posts[postIndex],
                ...data,
                modifiedDate: new Date().toISOString().split('T')[0]
            };
            localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
            
            return {
                success: true,
                data: this.posts[postIndex],
                message: 'Post updated successfully',
                timestamp: new Date().toISOString()
            };
        }
        
        return {
            success: false,
            error: 'Post not found',
            timestamp: new Date().toISOString()
        };
    }

    deletePost(id) {
        const postIndex = this.posts.findIndex(p => p.id === parseInt(id));
        if (postIndex !== -1) {
            const deletedPost = this.posts[postIndex];
            this.posts = this.posts.filter(p => p.id !== parseInt(id));
            localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
            
            return {
                success: true,
                data: deletedPost,
                message: 'Post deleted successfully',
                timestamp: new Date().toISOString()
            };
        }
        
        return {
            success: false,
            error: 'Post not found',
            timestamp: new Date().toISOString()
        };
    }

    getPostsByCategory(category) {
        const results = this.posts.filter(post => post.category === category);
        return {
            success: true,
            data: results,
            count: results.length,
            category: category,
            timestamp: new Date().toISOString()
        };
    }
}

// Express.js API Implementation
if (typeof module !== 'undefined' && module.exports) {
    const express = require('express');
    const cors = require('cors');
    const app = express();
    
    app.use(cors());
    app.use(express.json());
    
    const api = new BSSPlusAPI();
    
    // GET /api/posts - Get all posts
    app.get('/api/posts', (req, res) => {
        const response = api.getAllPosts();
        res.json(response);
    });
    
    // GET /api/post/:id - Get single post
    app.get('/api/post/:id', (req, res) => {
        const response = api.getPost(req.params.id);
        res.json(response);
    });
    
    // GET /api/search?q=query - Search posts
    app.get('/api/search', (req, res) => {
        const query = req.query.q || '';
        const response = api.searchPosts(query);
        res.json(response);
    });
    
    // GET /api/category/:category - Get posts by category
    app.get('/api/category/:category', (req, res) => {
        const response = api.getPostsByCategory(req.params.category);
        res.json(response);
    });
    
    // POST /api/posts - Create new post
    app.post('/api/posts', (req, res) => {
        const response = api.createPost(req.body);
        res.json(response);
    });
    
    // PUT /api/post/:id - Update post
    app.put('/api/post/:id', (req, res) => {
        const response = api.updatePost(req.params.id, req.body);
        res.json(response);
    });
    
    // DELETE /api/post/:id - Delete post
    app.delete('/api/post/:id', (req, res) => {
        const response = api.deletePost(req.params.id);
        res.json(response);
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`BSSPlus API running on port ${PORT}`);
    });
}

// Browser implementation
if (typeof window !== 'undefined') {
    window.BSSPlusAPI = new BSSPlusAPI();
}