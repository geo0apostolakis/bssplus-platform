# BSSPlus Platform API Usage Guide

## Overview
The BSSPlus Platform now includes a comprehensive API for accessing post data via HTTP requests. This guide explains how to use the API for external integrations.

## API Structure

### Current Implementation
- **Frontend API**: Accessible via `window.BSSPlusAPI` in the browser
- **Backend API**: Can be implemented using the provided `api.js` file with Express.js

### API Endpoints

#### 1. Get All Posts
**Method**: GET  
**Endpoint**: `/api/posts`  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Welcome to BSSPlus Platform",
      "category": "announcements",
      "content": "Post content...",
      "author": "System Administrator",
      "createdDate": "2024-10-15",
      "modifiedDate": "2024-10-15",
      "tags": ["welcome", "platform", "introduction"],
      "status": "published"
    }
  ],
  "count": 1,
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

#### 2. Get Single Post
**Method**: GET  
**Endpoint**: `/api/post/:id`  
**Example**: `/api/post/1`  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Welcome to BSSPlus Platform",
    "category": "announcements",
    "content": "Post content...",
    "author": "System Administrator",
    "createdDate": "2024-10-15",
    "modifiedDate": "2024-10-15",
    "tags": ["welcome", "platform", "introduction"],
    "status": "published"
  },
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

#### 3. Search Posts
**Method**: GET  
**Endpoint**: `/api/search?q=query`  
**Example**: `/api/search?q=digital transformation`  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "Digital Transformation Strategy Guidelines",
      "category": "guidelines",
      "content": "Comprehensive guide...",
      "author": "Digital Strategy Team",
      "createdDate": "2024-10-10",
      "modifiedDate": "2024-10-12",
      "tags": ["digital transformation", "strategy", "guidelines"],
      "status": "published"
    }
  ],
  "count": 1,
  "query": "digital transformation",
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

#### 4. Get Posts by Category
**Method**: GET  
**Endpoint**: `/api/category/:category`  
**Example**: `/api/category/guidelines`  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "Digital Transformation Strategy Guidelines",
      "category": "guidelines",
      "content": "Comprehensive guide...",
      "author": "Digital Strategy Team",
      "createdDate": "2024-10-10",
      "modifiedDate": "2024-10-12",
      "tags": ["digital transformation", "strategy", "guidelines"],
      "status": "published"
    }
  ],
  "count": 1,
  "category": "guidelines",
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

#### 5. Create Post
**Method**: POST  
**Endpoint**: `/api/posts`  
**Headers**: `Content-Type: application/json`  
**Body**:
```json
{
  "title": "New Post Title",
  "category": "announcements",
  "content": "Post content here...",
  "tags": ["tag1", "tag2"],
  "author": "API User"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "New Post Title",
    "category": "announcements",
    "content": "Post content here...",
    "author": "API User",
    "createdDate": "2024-10-22",
    "modifiedDate": "2024-10-22",
    "tags": ["tag1", "tag2"],
    "status": "published"
  },
  "message": "Post created successfully",
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

#### 6. Update Post
**Method**: PUT  
**Endpoint**: `/api/post/:id`  
**Headers**: `Content-Type: application/json`  
**Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Updated Title",
    "category": "announcements",
    "content": "Updated content...",
    "author": "API User",
    "createdDate": "2024-10-22",
    "modifiedDate": "2024-10-22",
    "tags": ["tag1", "tag2"],
    "status": "published"
  },
  "message": "Post updated successfully",
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

#### 7. Delete Post
**Method**: DELETE  
**Endpoint**: `/api/post/:id`  
**Example**: `/api/post/123`  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Post to Delete",
    "category": "announcements",
    "content": "Content...",
    "author": "API User",
    "createdDate": "2024-10-22",
    "modifiedDate": "2024-10-22",
    "tags": ["tag1", "tag2"],
    "status": "published"
  },
  "message": "Post deleted successfully",
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Post not found",
  "timestamp": "2024-10-22T10:30:00.000Z"
}
```

## JavaScript Usage Examples

### Using the Frontend API
```javascript
// Get all posts
const response = window.BSSPlusAPI.getAllPosts();
console.log('All posts:', response.data);

// Search posts
const searchResults = window.BSSPlusAPI.searchPosts('digital transformation');
console.log('Search results:', searchResults.data);

// Create a new post
const newPost = {
    title: "API Integration Guide",
    category: "guidelines",
    content: "This post explains how to use the BSSPlus API...",
    tags: ["api", "integration", "development"]
};
const created = window.BSSPlusAPI.createPost(newPost);
console.log('Created post:', created.data);
```

### Using HTTP Requests
```javascript
// Get all posts
fetch('/api/posts')
    .then(response => response.json())
    .then(data => console.log('All posts:', data.data));

// Create a new post
fetch('/api/posts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        title: "API Integration Guide",
        category: "guidelines",
        content: "This post explains how to use the BSSPlus API...",
        tags: ["api", "integration", "development"]
    })
})
.then(response => response.json())
.then(data => console.log('Created post:', data.data));

// Search posts
fetch('/api/search?q=digital transformation')
    .then(response => response.json())
    .then(data => console.log('Search results:', data.data));
```

## Backend Implementation

To implement the API backend, use the provided `api.js` file:

```bash
# Install dependencies
npm install express cors

# Run the API server
node api.js
```

The API will be available at `http://localhost:3000/api/`

## Authentication

The current implementation uses session-based authentication through the login system. For API authentication, consider implementing:

1. **API Keys**: Simple key-based authentication
2. **JWT Tokens**: Token-based authentication
3. **OAuth 2.0**: For third-party integrations

## Rate Limiting

For production use, implement rate limiting:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## CORS Configuration

For cross-origin requests, configure CORS:

```javascript
const cors = require('cors');

app.use(cors({
    origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
    credentials: true
}));
```

## WebSocket Support

For real-time updates, consider adding WebSocket support:

```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('subscribe-posts', () => {
        socket.join('posts-room');
    });
    
    // Emit updates when posts change
    socket.to('posts-room').emit('posts-updated', newPosts);
});
```

## Support

For API-related questions:
1. Check the API documentation in `DATABASE_INTEGRATION.md`
2. Review the example implementations in this file
3. Test with the provided sample data
4. Monitor browser console for any errors

## Next Steps

1. Set up the backend API server using `api.js`
2. Configure authentication and security
3. Implement database integration
4. Add monitoring and logging
5. Deploy to production environment