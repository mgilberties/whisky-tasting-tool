# 🥃 Whisky Tasting Tool

An interactive web app for hosting blind whisky tastings with friends. Participants submit their guesses privately, and the host can review all submissions before revealing the results.

## ✨ Features

- **Host tasting sessions** with unique join codes
- **Add whiskies** with detailed information (name, age, ABV, region, distillery, category, IB/OB)
- **Participants join** using session codes
- **Submit guesses** for each whisky (0-5 scoring system)
- **Real-time updates** with live notifications
- **Review submissions** before revealing results
- **Compare results** showing actual vs. guessed details
- **Mobile-friendly** responsive design

## 🚀 Quick Setup

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor
3. Get your Project URL and anon key from Settings → API

### 2. Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start hosting tastings!

## 🎯 How to Use

### For Hosts:

1. Click "Host a Tasting" and enter your name
2. Add whiskies with their details
3. Share the session code with participants
4. Click "Start Tasting" when everyone has joined
5. Monitor submissions in real-time
6. Review all guesses before revealing results

### For Participants:

1. Click "Join a Tasting" and enter the session code
2. Wait for the host to start the tasting
3. Taste each whisky and submit your guesses
4. Navigate between whiskies using the whisky selector
5. View results when the host reveals them

## 🏆 Scoring System

- **0-5 scale** with 0.5 increments allowed
- **Real-time submission tracking** for hosts
- **Progress indicators** for participants
- **Live notifications** for session updates

## 🚀 Deploy

Deploy for free on Vercel:

```bash
npm run build
npx vercel --prod
```

Your Supabase backend is already configured for production use!

## 🛠 Technical Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Deployment**: Vercel
- **Real-time**: Supabase WebSocket subscriptions

Perfect for whisky enthusiasts who want to add some friendly competition to their tastings! 🥃
