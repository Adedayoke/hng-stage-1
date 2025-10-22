# String Analyzer Service - HNG Stage 1

A RESTful API service that analyzes strings and stores their computed properties. This service calculates various string metrics including length, palindrome detection, character frequency, and SHA-256 hashing.

## Features

- **String Analysis**: Automatically compute string properties including:
  - Length
  - Palindrome detection (case-insensitive)
  - Unique character count
  - Word count
  - SHA-256 hash
  - Character frequency mapping

- **CRUD Operations**: Create, read, and delete string records
- **Advanced Filtering**: Query strings by multiple parameters
- **Persistent Storage**: MongoDB database integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Hashing**: Crypto (SHA-256)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (Node Package Manager)
- MongoDB Atlas account (for cloud database) or local MongoDB installation

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adedayoke/hng-stage-1
   cd stage-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3000
   DB_URI=your_mongodb_connection_string
   ```
   
   Replace `your_mongodb_connection_string` with your actual MongoDB connection string.
   
   **Example MongoDB URI:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/string-analyzer?retryWrites=true&w=majority
   ```

## Dependencies

The project uses the following npm packages:

- **express** (^5.1.0) - Web framework for Node.js
- **mongoose** (^8.19.2) - MongoDB object modeling tool
- **mongodb** (^6.20.0) - Official MongoDB driver
- **dotenv** (^17.2.3) - Environment variable management
- **crypto** (^1.0.1) - Cryptographic functionality (SHA-256 hashing)
- **nodemon** (^3.1.10) - Development auto-restart utility

## Running Locally

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

You should see:
```
MongoDB connected
Server running on PORT 3000
```

## API Endpoints

### 1. Create/Analyze String
**POST** `/strings`

Analyzes a string and stores its properties.

**Request Body:**
```json
{
  "value": "string to analyze"
}
```

**Success Response (201 Created):**
```json
{
  "id": "sha256_hash_value",
  "value": "string to analyze",
  "properties": {
    "length": 16,
    "is_palindrome": false,
    "unique_characters": 12,
    "word_count": 3,
    "sha256_hash": "abc123...",
    "character_frequency_map": {
      "s": 2,
      "t": 3,
      "r": 2,
      " ": 2
    }
  },
  "created_at": "2025-10-22T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing "value" field
- `409 Conflict`: String already exists
- `422 Unprocessable Entity`: Invalid data type (must be string)

---

### 2. Get Specific String
**GET** `/strings/{string_value}`

Retrieves a specific string by its value.

**Success Response (200 OK):**
```json
{
  "id": "sha256_hash_value",
  "value": "requested string",
  "properties": { /* ... */ },
  "created_at": "2025-10-22T10:00:00Z"
}
```

**Error Response:**
- `404 Not Found`: String does not exist

---

### 3. Get All Strings with Filtering
**GET** `/strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a`

Retrieves all strings with optional filtering.

**Query Parameters:**
- `is_palindrome` (boolean): Filter palindromes (true/false)
- `min_length` (integer): Minimum string length
- `max_length` (integer): Maximum string length
- `word_count` (integer): Exact word count
- `contains_character` (string): Single character to search for

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "hash1",
      "value": "string1",
      "properties": { /* ... */ },
      "created_at": "2025-10-22T10:00:00Z"
    }
  ],
  "count": 15,
  "filters_applied": {
    "is_palindrome": true,
    "min_length": 5,
    "max_length": 20,
    "word_count": 2,
    "contains_character": "a"
  }
}
```

**Error Response:**
- `400 Bad Request`: Invalid query parameter values or types

---

### 4. Delete String
**DELETE** `/strings/{string_value}`

Deletes a specific string from the database.

**Success Response:**
- `204 No Content`: String successfully deleted

**Error Response:**
- `404 Not Found`: String does not exist

---

## Example Usage

### Using cURL

**Create a string:**
```bash
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "hello world"}'
```

**Get a specific string:**
```bash
curl http://localhost:3000/strings/hello%20world
```

**Get all palindromes:**
```bash
curl "http://localhost:3000/strings?is_palindrome=true"
```

**Delete a string:**
```bash
curl -X DELETE http://localhost:3000/strings/hello%20world
```

### Using JavaScript (fetch)

```javascript
// Create a string
const response = await fetch('http://localhost:3000/strings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ value: 'racecar' })
});
const data = await response.json();
console.log(data);
```

## Project Structure

```
stage-1/
├── src/
│   ├── app.js           # Main application file
│   ├── models/
│   │   └── string.js    # Mongoose schema for strings
│   ├── config/          # Configuration files (empty)
│   ├── routes/          # Route handlers (empty)
│   └── services/        # Business logic (empty)
├── .env                 # Environment variables (not in git)
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
└── README.md           # This file
```

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PORT` | Server port number | Yes | `3000` |
| `DB_URI` | MongoDB connection string | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

## Testing

You can test the API using:
- **Postman**: Import the endpoints and test manually
- **cURL**: Use the command-line examples above
- **Thunder Client**: VS Code extension for API testing
- **REST Client**: VS Code extension using `.http` files

## Deployment

This application can be deployed to various platforms:

### Recommended Platforms:
- **Railway**: [railway.app](https://railway.app)
- **Heroku**: [heroku.com](https://heroku.com)
- **AWS**: Elastic Beanstalk or EC2
- **DigitalOcean**: App Platform
- **Fly.io**: [fly.io](https://fly.io)

### Deployment Steps (Railway Example):
1. Push your code to GitHub
2. Connect your GitHub repo to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically

**Note**: Vercel and Render are not allowed for this project.

## Error Handling

The API implements proper HTTP status codes:
- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request format
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `422 Unprocessable Entity`: Invalid data type
- `500 Internal Server Error`: Server error

## Contributing

This is a stage 1 task for HNG Internship. For questions or issues, please contact the project maintainer.

## License

ISC

## Author

Oke Habeeb Adedayo
adedayoke2006@gmail.com

---

**HNG Internship Stage 1 - Backend Track**
