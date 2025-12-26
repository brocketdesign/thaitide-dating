# ThaiTide - Modern Dating Platform

ThaiTide is a vibrant modern dating platform that brings together Thai singles and international users for authentic connections, romance, and cultural discovery.

## Features

### 🎯 Core Features
- **Mobile-First Design**: Sleek, responsive UI built with Next.js and Tailwind CSS
- **Clerk Authentication**: Secure user authentication and session management
- **Detailed Profiles**: Rich user profiles with photos, bio, interests, and languages
- **Photo Verification**: AI-powered photo verification using OpenAI API
- **Swipe-Based Matching**: Intuitive swipe interface for discovering potential matches
- **Advanced Search**: Filter by age, location, language, and interests
- **Geolocation Search**: Find matches nearby with distance-based filtering
- **Real-Time Messaging**: Instant chat powered by Socket.io
- **Premium Features**: Boosted visibility, unlimited likes, and exclusive perks
- **Stripe Subscriptions**: Secure payment processing for premium plans
- **Multilingual**: Full support for Thai (ไทย) and English

### 💎 Premium Perks
- Unlimited likes
- See who liked you
- Boosted profile visibility
- Advanced filters
- No ads
- Rewind last swipe
- Priority support

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **State Management**: React Hooks
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios
- **UI Components**: React Icons
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: Clerk (verification)
- **Real-time**: Socket.io
- **Payments**: Stripe
- **AI**: OpenAI API (photo verification)
- **Security**: bcrypt, JWT

## Project Structure

```
thaitide-dating/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   │   ├── discover/    # Swipe interface
│   │   │   ├── matches/     # Matches list
│   │   │   ├── messages/    # Real-time chat
│   │   │   ├── premium/     # Subscription plans
│   │   │   ├── profile/     # Profile management
│   │   │   ├── sign-in/     # Authentication
│   │   │   └── sign-up/     # Registration
│   │   ├── components/      # Reusable components
│   │   │   ├── ui/          # UI components
│   │   │   └── features/    # Feature components
│   │   └── lib/             # Utilities
│   │       ├── api.ts       # API client
│   │       └── socket.ts    # Socket.io client
│   └── package.json
│
└── backend/                  # Node.js/Express backend
    ├── src/
    │   ├── config/          # Configuration
    │   │   └── database.ts  # MongoDB connection
    │   ├── models/          # Mongoose models
    │   │   ├── User.ts      # User model
    │   │   ├── Match.ts     # Match model
    │   │   ├── Message.ts   # Message model
    │   │   └── Subscription.ts
    │   ├── controllers/     # Route controllers
    │   │   ├── userController.ts
    │   │   ├── matchController.ts
    │   │   ├── messageController.ts
    │   │   └── subscriptionController.ts
    │   ├── routes/          # API routes
    │   ├── services/        # Business logic
    │   │   ├── photoVerification.ts
    │   │   └── stripe.ts
    │   └── index.ts         # Server entry point
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Clerk account (for authentication)
- OpenAI API key (for photo verification)
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/brocketdesign/thaitide-dating.git
cd thaitide-dating
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Configure backend environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

5. Configure frontend environment:
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### Running the Application

1. Start MongoDB (if running locally):
```bash
mongod
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. Start the frontend development server:
```bash
cd frontend
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/thaitide-dating
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
FRONTEND_URL=http://localhost:3000
CLERK_SECRET_KEY=your-clerk-secret-key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## API Endpoints

### Users
- `POST /api/users` - Create user profile
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile
- `POST /api/users/:userId/photos` - Upload and verify photo

### Matches
- `POST /api/matches/:userId/swipe-right` - Like a user
- `POST /api/matches/:userId/swipe-left` - Pass on a user
- `GET /api/matches/:userId/matches` - Get all matches
- `GET /api/matches/:userId/potential` - Get potential matches

### Messages
- `POST /api/messages` - Send a message
- `GET /api/messages/:matchId` - Get messages for a match
- `PUT /api/messages/:messageId/read` - Mark message as read

### Subscriptions
- `POST /api/subscriptions/create-checkout` - Create subscription
- `POST /api/subscriptions/webhook` - Stripe webhook handler

## Socket.io Events

### Client → Server
- `register` - Register user with socket
- `send_message` - Send a chat message
- `typing` - User is typing

### Server → Client
- `new_message` - New message received
- `message_sent` - Message sent confirmation
- `user_typing` - Other user is typing

## Deployment

### Backend
1. Build the TypeScript code:
```bash
cd backend
npm run build
```

2. Start the production server:
```bash
npm start
```

### Frontend
1. Build the Next.js application:
```bash
cd frontend
npm run build
```

2. Start the production server:
```bash
npm start
```

## License

This project is licensed under the ISC License.

## Support

For support, email support@thaitide.dating or join our community forum.

---

Made with ❤️ for connecting hearts across cultures

