# BSSPlus Platform - Database Integration Guide

## Overview
This guide explains how to connect the BSSPlus Platform to a database like Supabase and use the API for external data access.

## Current Implementation
The platform currently uses localStorage for data persistence, but provides a complete API layer for easy database integration.

## Database Integration Steps

### 1. Choose Your Database
Recommended options:
- **Supabase** (PostgreSQL-based, real-time, easy setup)
- **Firebase** (NoSQL, real-time, Google ecosystem)
- **MongoDB Atlas** (NoSQL, flexible schema)
- **PlanetScale** (MySQL-compatible, serverless)

### 2. Supabase Integration Example

#### Step 1: Set up Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a project
2. Get your project URL and anon key from the project settings
3. Install Supabase client: `npm install @supabase/supabase-js`

#### Step 2: Create Database Tables
```sql
-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    tags TEXT[],
    created_date DATE DEFAULT CURRENT_DATE,
    modified_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'published'
);

-- Users table (if needed)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Step 3: Update main.js with Supabase Client
Replace the localStorage implementation with Supabase calls:

```javascript
// Add Supabase client
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// Update loadSampleData method
async loadSampleData() {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_date', { ascending: false });
    
    if (error) {
        console.error('Error loading posts:', error);
        this.loadDefaultSampleData();
    } else {
        this.posts = data || [];
    }
}

// Update createPost method
async createPost(data) {
    const newPost = {
        ...data,
        author: localStorage.getItem('bssplus_username') || 'Manager',
        created_date: new Date().toISOString().split('T')[0],
        modified_date: new Date().toISOString().split('T')[0],
        status: 'published'
    };
    
    const { data: insertedPost, error } = await supabase
        .from('posts')
        .insert([newPost])
        .single();
    
    if (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
    
    this.posts.unshift(insertedPost);
    this.renderPosts();
    
    return {
        success: true,
        data: insertedPost,
        message: 'Post created successfully',
        timestamp: new Date().toISOString()
    };
}
```

### 3. Environment Configuration
Create a `.env` file for your database credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Usage

### Available API Endpoints
The platform exposes the following API through the `window.BSSPlusAPI` object:

#### Get All Posts
```javascript
const response = window.BSSPlusAPI.getAllPosts();
console.log(response);
// Returns: { success: true, data: [...], count: 12, timestamp: "2024-10-22T..." }
```

#### Get Single Post
```javascript
const response = window.BSSPlusAPI.getPost(1);
console.log(response);
// Returns: { success: true, data: { id: 1, title: "...", ... }, timestamp: "..." }
```

#### Search Posts
```javascript
const response = window.BSSPlusAPI.searchPosts('digital transformation');
console.log(response);
// Returns: { success: true, data: [...], count: 2, query: "digital transformation", timestamp: "..." }
```

#### Create Post
```javascript
const newPost = {
    title: "New Post",
    category: "announcements",
    content: "Post content...",
    tags: ["tag1", "tag2"]
};
const response = window.BSSPlusAPI.createPost(newPost);
console.log(response);
// Returns: { success: true, data: { id: 123, ... }, message: "Post created successfully", timestamp: "..." }
```

#### Update Post
```javascript
const updates = {
    title: "Updated Title",
    content: "Updated content..."
};
const response = window.BSSPlusAPI.updatePost(123, updates);
console.log(response);
// Returns: { success: true, data: { ... }, message: "Post updated successfully", timestamp: "..." }
```

#### Delete Post
```javascript
const response = window.BSSPlusAPI.deletePost(123);
console.log(response);
// Returns: { success: true, data: { ... }, message: "Post deleted successfully", timestamp: "..." }
```

#### Get Posts by Category
```javascript
const response = window.BSSPlusAPI.getPostsByCategory('guidelines');
console.log(response);
// Returns: { success: true, data: [...], count: 3, category: "guidelines", timestamp: "..." }
```

### HTTP Request Examples

#### Fetch All Posts
```javascript
// If you implement the API as HTTP endpoints
fetch('/api/posts')
    .then(response => response.json())
    .then(data => console.log(data));
```

#### Create Post via HTTP
```javascript
fetch('/api/posts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN' // If using authentication
    },
    body: JSON.stringify({
        title: "New Post",
        category: "announcements",
        content: "Post content...",
        tags: ["tag1", "tag2"]
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Security Considerations

### 1. Authentication
- Implement JWT tokens for API authentication
- Use refresh tokens for long-lived sessions
- Add rate limiting to prevent abuse

### 2. Database Security
- Use parameterized queries to prevent SQL injection
- Implement row-level security (RLS) in PostgreSQL
- Regular database backups
- Encrypt sensitive data at rest

### 3. API Security
- Add CORS configuration
- Implement input validation
- Use HTTPS for all communications
- Add request signing for sensitive operations

## Migration Guide

### From LocalStorage to Database

1. **Export Current Data**
```javascript
// Run this in browser console on current platform
const posts = JSON.parse(localStorage.getItem('bssplus_posts') || '[]');
console.log(JSON.stringify(posts, null, 2));
```

2. **Import to Database**
```javascript
// Use the exported data to populate your database
posts.forEach(post => {
    // Insert into database
    await supabase.from('posts').insert([post]);
});
```

3. **Update Platform Code**
- Replace localStorage calls with database calls
- Add error handling for network failures
- Implement loading states

## Real-time Features

### With Supabase Real-time Subscriptions
```javascript
// Subscribe to changes
const subscription = supabase
    .from('posts')
    .on('INSERT', payload => {
        console.log('New post:', payload.new);
        // Update UI with new post
    })
    .on('UPDATE', payload => {
        console.log('Updated post:', payload.new);
        // Update UI with changed post
    })
    .on('DELETE', payload => {
        console.log('Deleted post:', payload.old);
        // Remove post from UI
    })
    .subscribe();
```

## Performance Optimization

### 1. Caching
- Implement browser caching for static assets
- Use Redis for API response caching
- Add database query caching

### 2. Pagination
```javascript
// Add pagination to posts endpoint
const { data, error } = await supabase
    .from('posts')
    .select('*')
    .range(0, 9) // Get first 10 posts
    .order('created_date', { ascending: false });
```

### 3. Indexing
Add database indexes for better performance:
```sql
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_date ON posts(created_date);
CREATE INDEX idx_posts_title ON posts(title);
```

## Monitoring and Analytics

### 1. Database Monitoring
- Track query performance
- Monitor connection pools
- Set up alerts for errors

### 2. API Monitoring
- Log all API requests
- Track response times
- Monitor error rates

## Support

For questions about database integration:
1. Check the official documentation of your chosen database
2. Review the API examples in this guide
3. Test with small datasets first
4. Implement proper error handling

## Next Steps

1. Choose your preferred database solution
2. Set up the database schema
3. Update the platform code with database calls
4. Test thoroughly with sample data
5. Deploy to production
6. Monitor performance and usage