# File Upload Feature - Implementation Guide

## Overview
File upload functionality for the FreeTun messaging system, allowing users to share files within project conversations.

---

## 📁 File Structure

```
backend/
├── uploads/
│   └── messages/
│       └── 2025/
│           └── 11/
│               └── [uploaded-files]
├── src/
│   ├── middleware/
│   │   └── upload.ts          # Multer configuration & validation
│   └── controllers/
│       └── messageController.ts  # Upload/Download handlers
```

---

## 🔧 Implementation Components

### 1. Upload Middleware (`upload.ts`)

**Features:**
- Organized storage: `uploads/messages/{year}/{month}/{filename}`
- Unique filenames: `{timestamp}-{random}-{sanitized-name}.ext`
- File type validation
- Individual size limits per file category
- Multiple file upload support (max 5 files)

**Allowed File Types:**

| Category | Types | Max Size |
|----------|-------|----------|
| **Images** | JPG, PNG, GIF, SVG, WEBP | 5MB |
| **Documents** | PDF, DOC, DOCX, TXT, MD | 10MB |
| **Videos** | MP4, MOV, AVI | 50MB |
| **Archives** | ZIP, RAR, 7Z | 25MB |
| **Design** | AI, PSD | 10MB |
| **Code** | JS, TS, HTML, CSS, JSON | 10MB |

---

## 🚀 API Endpoints

### 1. Upload Files
```http
POST /api/v1/messages/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- files: File[] (max 5 files)
```

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "files": [
      {
        "url": "/uploads/messages/2025/11/1699123456-abc123-logo.png",
        "originalName": "logo.png",
        "mimetype": "image/png",
        "size": 245678
      }
    ]
  }
}
```

### 2. Send Message with Attachments
```http
POST /api/v1/messages/conversations/:conversation_id/messages
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "content": "Here are the files you requested",
  "attachments": [
    "/uploads/messages/2025/11/1699123456-abc123-logo.png",
    "/uploads/messages/2025/11/1699123457-def456-document.pdf"
  ]
}
```

### 3. Download File
```http
GET /api/v1/messages/files/:year/:month/:filename
Authorization: Bearer {token}
```

**Example:**
```
GET /api/v1/messages/files/2025/11/1699123456-abc123-logo.png
```

**Access Control:**
- Only conversation participants can download files
- System verifies the file belongs to a message in user's conversation

---

## 📝 Usage Workflow

### Client-Side Upload Flow

```javascript
// 1. Upload files first
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const uploadResponse = await axios.post(
  '/api/v1/messages/upload',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);

const fileUrls = uploadResponse.data.data.files.map(f => f.url);

// 2. Send message with file URLs
await axios.post(
  `/api/v1/messages/conversations/${conversationId}/messages`,
  {
    content: "Check out these files",
    attachments: fileUrls
  },
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

### Display Files in Messages

```javascript
// When rendering a message
message.attachments.forEach(fileUrl => {
  const filename = fileUrl.split('/').pop();
  const fileLink = `${API_BASE_URL}${fileUrl}`;
  
  // Display download link
  console.log(`<a href="${fileLink}" download>${filename}</a>`);
});
```

---

## 🔒 Security Features

### 1. Authentication
- All upload/download endpoints require JWT authentication
- Token validated before processing

### 2. Authorization
- Users can only download files from their conversations
- File access checked against conversation participants

### 3. File Validation
- MIME type verification (not just extension)
- Size limits enforced per file type
- Maximum 5 files per upload request
- Invalid files rejected before storage

### 4. Storage Security
- Unique random filenames prevent overwrites
- Files organized by date for easy management
- Original filenames sanitized (special chars removed)

### 5. Error Handling
- Failed uploads automatically cleaned up
- Descriptive error messages
- Size violation details provided

---

## 🛠️ Configuration

### Environment Variables
No specific environment variables needed. Uses existing:
- `JWT_SECRET` - For authentication
- Storage uses local filesystem

### Storage Location
```
uploads/messages/{year}/{month}/{timestamp}-{random}-{name}.ext
```

Example:
```
uploads/messages/2025/11/1699123456789-abc123def456-project-brief.pdf
```

---

## 📊 Database Integration

### Message Model (Already Supports)
```typescript
interface Message {
  id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  content: string;
  attachments: string[];  // Array of file URLs
  is_read: boolean;
  created_at: Date;
}
```

### Example Message Record
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "conversation_id": "project-conv-uuid",
  "sender_id": "user-uuid",
  "content": "Final deliverables",
  "attachments": [
    "/uploads/messages/2025/11/1699123456-abc-logo.png",
    "/uploads/messages/2025/11/1699123457-def-guide.pdf"
  ],
  "is_read": false,
  "created_at": "2025-11-05T12:00:00Z"
}
```

---

## 🧪 Testing

### Manual Testing with cURL

**1. Upload File:**
```bash
curl -X POST http://localhost:5000/api/v1/messages/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/file1.png" \
  -F "files=@/path/to/file2.pdf"
```

**2. Send Message with Attachments:**
```bash
curl -X POST http://localhost:5000/api/v1/messages/conversations/CONV_ID/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Here are the files",
    "attachments": ["/uploads/messages/2025/11/1699123456-abc-file.png"]
  }'
```

**3. Download File:**
```bash
curl -X GET http://localhost:5000/api/v1/messages/files/2025/11/1699123456-abc-file.png \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output downloaded-file.png
```

---

## 🚨 Error Responses

### File Type Not Allowed
```json
{
  "success": false,
  "message": "File type not allowed. Allowed types: images, documents, videos, archives, design files, code files."
}
```

### File Too Large
```json
{
  "success": false,
  "message": "File size validation failed",
  "errors": [
    "File 'video.mp4' exceeds size limit for video files (50MB)"
  ]
}
```

### Unauthorized Access
```json
{
  "success": false,
  "message": "You do not have access to this file"
}
```

### File Not Found
```json
{
  "success": false,
  "message": "File not found"
}
```

---

## 💡 Best Practices

### Client-Side
1. **Show upload progress** - Use axios onUploadProgress
2. **Validate before upload** - Check file size/type client-side first
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Preview images** - Show thumbnails before sending
5. **Compress large files** - Warn users about large file sizes

### Server-Side
1. **Virus scanning** - Consider adding antivirus scanning in production
2. **Backup strategy** - Regular backups of uploads directory
3. **Storage cleanup** - Delete files from deleted messages periodically
4. **CDN integration** - Use CDN for serving files in production
5. **Rate limiting** - Prevent upload spam

---

## 🔄 Future Enhancements

### Planned Features
- [ ] Image thumbnail generation
- [ ] File preview in chat (PDF, images)
- [ ] Drag & drop upload UI
- [ ] Upload progress tracking
- [ ] Batch download (zip multiple files)
- [ ] Cloud storage integration (S3, Azure)
- [ ] Virus scanning (ClamAV)
- [ ] File expiration after X days
- [ ] Upload quota per user
- [ ] File search within conversations

---

## 📖 Related Documentation

- [MESSAGING_SYSTEM_SUMMARY.md](./MESSAGING_SYSTEM_SUMMARY.md) - Complete messaging system docs
- [API Documentation](./API_DOCS.md) - Full API reference
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure

---

## ✅ Implementation Complete

**Status:** ✅ Fully Implemented

**Components:**
- ✅ Upload middleware with Multer
- ✅ File validation (type & size)
- ✅ Upload endpoint
- ✅ Download endpoint with access control
- ✅ Static file serving
- ✅ Integration with message system

**Ready for:**
- Testing with real files
- Frontend integration
- Production deployment (with enhancements)

---

**Last Updated:** November 5, 2025
