# ThaiTide Setup Guide

This guide will walk you through setting up the ThaiTide dating platform for local development.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18 or higher
- npm or yarn
- MongoDB (can be local or cloud instance like MongoDB Atlas)
- Git

## Required External Services

You'll need to create accounts and obtain API keys for:
1. **Clerk** - Authentication (https://clerk.com)
2. **OpenAI** - Photo verification (https://openai.com)
3. **Stripe** - Payment processing (https://stripe.com)
4. **MongoDB** - Database (https://mongodb.com/atlas for cloud)

## Step 1: Clone the Repository

```bash
git clone https://github.com/brocketdesign/thaitide-dating.git
cd thaitide-dating
```

## Step 2: Backend Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
PORT=5000
NODE_ENV=development

# MongoDB - Get from MongoDB Atlas or use local
MONGODB_URI=mongodb://localhost:27017/thaitide-dating
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thaitide-dating

# JWT - Generate a random secret string
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# OpenAI - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
FRONTEND_URL=http://localhost:3000

# Clerk (for backend verification) - Get from https://dashboard.clerk.com
CLERK_SECRET_KEY=sk_test_...
```

### Start MongoDB

If using local MongoDB:
```bash
mongod
```

If using MongoDB Atlas, ensure your connection string is correct in `.env`.

### Build and Run Backend

```bash
# Development mode with hot reload
npm run dev

# OR build and run production
npm run build
npm start
```

The backend will start on `http://localhost:5000`

## Step 3: Frontend Setup

### Install Dependencies

```bash
cd ../frontend
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Clerk - Get from https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs (leave as is for standard setup)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/profile/create
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profile/create

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Stripe - Get from https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Run Frontend

```bash
# Development mode
npm run dev

# OR build and run production
npm run build
npm start
```

The frontend will start on `http://localhost:3000`

## Step 4: Clerk Configuration

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Under "Configure" → "API Keys", copy your keys to `.env.local`
4. Under "Configure" → "Paths", set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/profile/create`
   - After sign-up: `/profile/create`

## Step 5: Stripe Configuration (Optional for Testing)

1. Go to https://dashboard.stripe.com
2. Get your test mode API keys
3. Create products and prices for:
   - Premium Monthly ($9.99)
   - Premium Plus Monthly ($19.99)
4. Configure webhook endpoint: `http://localhost:5000/api/subscriptions/webhook`
5. Copy webhook secret to `.env`

## Step 6: OpenAI Configuration (Optional for Testing)

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env` in backend
4. Ensure you have credits in your OpenAI account

## Verification

Once everything is running:

1. Navigate to `http://localhost:3000`
2. Click "Get Started Free"
3. Sign up with Clerk
4. Create your profile
5. Start discovering matches!

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `ps aux | grep mongod`
- Check connection string format
- For Atlas: Ensure IP whitelist includes your IP

### Clerk Authentication Issues

- Verify API keys are correct
- Ensure URLs in Clerk dashboard match your configuration
- Check that you're using test keys in development

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`
- Ensure all environment variables are set

### Port Already in Use

- Backend: Change PORT in `.env`
- Frontend: `npm run dev -- -p 3001` (or any other port)

## Development Tips

### Hot Reload

Both frontend and backend support hot reload in development mode. Changes will automatically refresh.

### Database

View your MongoDB data using:
- MongoDB Compass (GUI): https://www.mongodb.com/products/compass
- mongosh (CLI): `mongosh mongodb://localhost:27017/thaitide-dating`

### API Testing

Use tools like:
- Postman
- Thunder Client (VS Code extension)
- curl commands

Example:
```bash
curl http://localhost:5000/api/health
```

### Socket.io Testing

Test real-time messaging by:
1. Open two browser windows
2. Sign in as different users
3. Create a match between them
4. Send messages in real-time

## Production Deployment

For production deployment, see the main README.md file for detailed instructions.

## Getting Help

- Check the [README.md](README.md) for feature documentation
- Review the code comments for implementation details
- Open an issue on GitHub for bugs or feature requests

---

Happy coding! 🚀❤️
