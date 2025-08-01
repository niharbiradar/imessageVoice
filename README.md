# Voice AI - Talk to Yourself

A simple, beautiful web application that lets you create AI voices and chat with them using ElevenLabs technology.

## 🚀 Quick Start

### 1. Get Your ElevenLabs API Key
- Go to [ElevenLabs](https://elevenlabs.io/)
- Sign up for a free account
- Get your API key from the dashboard

### 2. Setup
```bash
# Install dependencies
npm install

# Create environment file
cp env.example .env

# Add your ElevenLabs API key to .env
ELEVENLABS_API_KEY=your_api_key_here
```

### 3. Run the App
```bash
# Start the server
npm start

# Open in browser
http://localhost:3000
```

## ✨ Features

- **Voice Cloning**: Record your voice and create an AI clone
- **Text-to-Speech**: Chat with your AI voice
- **Mobile-Friendly**: Works perfectly on phones and tablets
- **Beautiful UI**: Modern glass-morphism design
- **Real-time**: Instant voice generation

## 🎯 How to Use

1. **Create a Voice**: Click "Create Voice" and record at least 30 seconds of clear speech
2. **Start Chatting**: Select your voice and type messages
3. **Listen**: Your AI voice will respond with natural speech

## 📱 Mobile Experience

The app is fully responsive and works great on mobile devices:
- Touch-friendly buttons
- Optimized layout for small screens
- Easy voice recording on mobile
- Smooth animations

## 🔧 Technical Details

- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Backend**: Node.js, Express
- **Voice AI**: ElevenLabs API
- **Audio**: Web Audio API for recording

## 🎨 Design Features

- Gradient backgrounds
- Glass-morphism effects
- Smooth animations
- Professional color scheme
- Intuitive navigation

## 📝 Free Tier Limits

- 5 voice creations per month
- 10,000 characters of text-to-speech
- Basic voice quality

## 🚀 Next Steps

This is a simple MVP. Future enhancements could include:
- User accounts and persistence
- Voice customization settings
- Conversation history
- Premium features
- Voice sharing

## 🐛 Troubleshooting

**Microphone not working?**
- Make sure to allow microphone access in your browser
- Try refreshing the page

**Voice creation failed?**
- Check your ElevenLabs API key
- Ensure you recorded at least 30 seconds
- Speak clearly and naturally

**Audio not playing?**
- Check your browser's audio settings
- Try a different browser

## 📄 License

MIT License - feel free to use and modify!
