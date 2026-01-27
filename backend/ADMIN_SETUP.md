# Admin User Setup Guide

This guide shows you how to grant admin access to users for the ThaiTide Dating admin dashboard.

## Quick Start (Easiest Method)

### Interactive Script (Recommended)
The interactive script walks you through the process step-by-step:

```bash
cd backend
npm run add-admin:interactive
```

You'll be prompted for:
1. MongoDB URI (can use default or enter production URI)
2. How to identify the user (by email or Clerk ID)
3. User email or Clerk ID
4. Confirmation to grant admin access

**Example Session:**
```
╔════════════════════════════════════════════════╗
║   ThaiTide Dating - Add Admin User Script     ║
╚════════════════════════════════════════════════╝

Default MongoDB URI: mongodb://localhost:27017/thaitide-dating
Use default URI? (y/n): y

🔌 Connecting to MongoDB...
✅ Connected successfully!

How would you like to identify the user?
1. By email
2. By Clerk ID
Enter choice (1 or 2): 1
Enter user email: admin@thaitide.com

🔍 Searching for user with email: admin@thaitide.com...

✅ User found:
┌─────────────────────────────────────────────┐
│ Username:     @admin                        │
│ Email:        admin@thaitide.com            │
│ Clerk ID:     user_xxxxxxxxxxxxx            │
│ Current Role: user                          │
└─────────────────────────────────────────────┘

Grant admin role to this user? (y/n): y

🔧 Updating user role to admin...
✅ User role updated successfully!

╔════════════════════════════════════════════════╗
║              SUCCESS! 🎉                       ║
║  User can now access /admin dashboard         ║
╚════════════════════════════════════════════════╝
```

---

## Command Line Method

For quick one-line commands, use the non-interactive script:

### Local Database

**By Email:**
```bash
npm run add-admin -- --email=user@example.com
```

**By Clerk ID:**
```bash
npm run add-admin -- --clerkId=user_xxxxxxxxxxxxx
```

### Production Database

**By Email:**
```bash
npm run add-admin -- --email=user@example.com --uri="mongodb+srv://username:password@cluster.mongodb.net/thaitide-dating"
```

**By Clerk ID:**
```bash
npm run add-admin -- --clerkId=user_xxxxxxxxxxxxx --uri="mongodb+srv://username:password@cluster.mongodb.net/thaitide-dating"
```

---

## Using Environment Variables

If your production MongoDB URI is already in `.env`:

```bash
# .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thaitide-dating
```

Then simply run:
```bash
npm run add-admin -- --email=user@example.com
# Script will use MONGODB_URI from .env automatically
```

---

## Manual Method (MongoDB Compass)

If you prefer a GUI:

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `thaitide-dating` → `users` collection
4. Find your user document (search by email or username)
5. Click "Edit Document"
6. Add field: `"role": "admin"`
7. Click "Update"

---

## Manual Method (MongoDB Shell)

Connect to your database and run:

```javascript
// Connect to database
use thaitide-dating

// Find user
db.users.findOne({ email: "user@example.com" })

// Update role to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Verify
db.users.findOne(
  { email: "user@example.com" },
  { role: 1, email: 1, username: 1 }
)
```

---

## Verify Admin Access

After granting admin access:

1. Start your servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Sign in as the admin user

3. Navigate to `/admin`

4. You should see the admin dashboard with:
   - User metrics
   - Analytics charts
   - User management tools

If you see "Forbidden" or get redirected, the role wasn't set correctly. Run the script again.

---

## Troubleshooting

### "User not found"
- Double-check the email or Clerk ID
- Make sure the user has completed onboarding
- Verify you're connected to the correct database

### "Connection failed"
- Check your MongoDB URI is correct
- Ensure MongoDB is running (local) or accessible (production)
- Verify credentials in URI are correct

### "User is already an admin"
- The user already has admin access
- No action needed

### Can't access /admin after setting role
- Clear browser cache and cookies
- Sign out and sign back in
- Check browser console for errors
- Verify backend is running and connected to correct database

---

## Security Notes

- **Keep admin access limited**: Only grant admin to trusted users
- **Production URIs**: Never commit production MongoDB URIs to git
- **Use environment variables**: Store sensitive credentials in `.env` files
- **Audit admin actions**: Consider adding audit logging for admin activities (future enhancement)

---

## Removing Admin Access

To revoke admin access, run the same script but manually edit the user document to set `role: "user"` or use MongoDB Compass/Shell:

```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "user" } }
)
```

---

## Next Steps

After setting up your first admin user:

1. Access the dashboard at `/admin`
2. Explore user metrics and analytics
3. Use the user management page to filter and search users
4. Monitor your app's growth and engagement

The dashboard auto-refreshes every 60 seconds to keep metrics up-to-date!
