const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Check if API key is set
if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
  console.warn('⚠️  ElevenLabs API key not set! Using fallback voices only.');
}

// In-memory storage for demo (replace with database in production)
let voices = [];
let conversations = [];

// Routes

// Get all voices (deprecated - use the ElevenLabs endpoint below)
app.get('/api/voices-old', (req, res) => {
  res.json(voices);
});

// Validate ElevenLabs API key
app.get('/api/validate-key', async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      return res.json({ 
        valid: false, 
        message: 'API key not configured' 
      });
    }

    // Test the API key by making a simple request
    const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (response.status === 200) {
      res.json({ 
        valid: true, 
        message: 'API key is valid',
        voiceCount: response.data.voices?.length || 0
      });
    } else {
      res.json({ 
        valid: false, 
        message: 'API key validation failed' 
      });
    }
  } catch (error) {
    console.error('API key validation error:', error.response?.status, error.response?.data);
    res.json({ 
      valid: false, 
      message: error.response?.data?.detail?.message || 'Invalid API key' 
    });
  }
});

// Get available voices from ElevenLabs (free tier voices)
app.get('/api/voices', async (req, res) => {
  try {
    // Check if API key is properly set
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      console.log('Using fallback voices (no API key)');
      return res.json(getFallbackVoices());
    }

    console.log('Fetching voices from ElevenLabs...');
    const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    console.log('ElevenLabs response status:', response.status);
    console.log('ElevenLabs response data keys:', Object.keys(response.data));

    // Check if we have voices in the response
    if (!response.data.voices || response.data.voices.length === 0) {
      console.log('No voices found in API response, using fallback voices');
      return res.json(getFallbackVoices());
    }

    // Show all available voices (not just first 5)
    const availableVoices = response.data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.labels?.description || voice.category || 'ElevenLabs voice',
      elevenlabs_voice_id: voice.voice_id,
      created_at: new Date().toISOString(),
      status: 'ready',
      is_free: voice.category === 'premade' || voice.category === 'cloned',
      category: voice.category
    }));

    console.log('Returning voices from ElevenLabs:', availableVoices.length, 'voices');
    res.json(availableVoices);
  } catch (error) {
    console.error('Error fetching voices from ElevenLabs:', error.response?.status, error.response?.data || error.message);
    
    // Return fallback voices on error
    console.log('Using fallback voices due to API error');
    res.json(getFallbackVoices());
  }
});

// Helper function for fallback voices
function getFallbackVoices() {
  return [
    {
      id: 'fallback-1',
      name: 'Rachel',
      description: 'Friendly and energetic voice',
      elevenlabs_voice_id: '21m00Tcm4TlvDq8ikWAM',
      created_at: new Date().toISOString(),
      status: 'ready',
      is_free: true
    },
    {
      id: 'fallback-2',
      name: 'Domi',
      description: 'Warm and engaging voice',
      elevenlabs_voice_id: 'AZnzlk1XvdvUeBnXmlld',
      created_at: new Date().toISOString(),
      status: 'ready',
      is_free: true
    },
    {
      id: 'fallback-3',
      name: 'Bella',
      description: 'Clear and professional voice',
      elevenlabs_voice_id: 'EXAVITQu4vr4xnSDxMaL',
      created_at: new Date().toISOString(),
      status: 'ready',
      is_free: true
    }
  ];
}

// Create a new voice (voice cloning) - DISABLED for free tier
app.post('/api/voices', upload.single('audio'), async (req, res) => {
  res.status(403).json({ 
    error: 'Voice cloning requires a paid subscription',
    message: 'Please upgrade to a paid plan to create custom voices, or use the free voices available.'
  });
});

// Text-to-speech
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice_id } = req.body;

    if (!text || !voice_id) {
      return res.status(400).json({ error: 'Text and voice_id are required' });
    }

    // Check if API key is set
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        message: 'Please set your ELEVENLABS_API_KEY in the .env file'
      });
    }

    // Find the voice by fetching from ElevenLabs API
    let voice = null;
    
    console.log('Looking for voice_id:', voice_id);
    
    try {
      const voicesResponse = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });
      
      console.log('Available voices:', voicesResponse.data.voices.map(v => ({ id: v.voice_id, name: v.name })));
      
      voice = voicesResponse.data.voices.find(v => v.voice_id === voice_id);
      
      if (!voice) {
        console.log('Voice not found in ElevenLabs, trying fallback voices');
        // Check fallback voices as backup
        const fallbackVoices = getFallbackVoices();
        voice = fallbackVoices.find(v => v.id === voice_id);
      }
    } catch (error) {
      console.error('Error fetching voices for TTS:', error);
      // Try fallback voices
      const fallbackVoices = getFallbackVoices();
      voice = fallbackVoices.find(v => v.id === voice_id);
    }
    
    if (!voice) {
      console.log('Voice not found in any source');
      return res.status(404).json({ error: 'Voice not found', voice_id: voice_id });
    }
    
    console.log('Found voice:', voice.name, 'with ID:', voice.voice_id);
    
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }

    console.log('Generating speech for voice:', voice.name, 'with text:', text.substring(0, 50) + '...');

    // Generate speech using ElevenLabs
    const voiceIdToUse = voice.voice_id || voice.elevenlabs_voice_id || voice.id;
    console.log('Using voice ID for TTS:', voiceIdToUse);
    
    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceIdToUse}`,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    console.log('Speech generated successfully, response size:', response.data.length);

    // Save audio file
    const audioFileName = `${uuidv4()}.mp3`;
    const audioPath = path.join('public', 'audio', audioFileName);
    
    if (!fs.existsSync(path.dirname(audioPath))) {
      fs.mkdirSync(path.dirname(audioPath), { recursive: true });
    }
    
    fs.writeFileSync(audioPath, response.data);

    const audioUrl = `/audio/${audioFileName}`;

    console.log('Audio saved to:', audioUrl);

    res.json({
      audio_url: audioUrl,
      text: text,
      voice_id: voice_id,
      duration: response.headers['content-length'] ? response.headers['content-length'] / 16000 : 0
    });

  } catch (error) {
    console.error('Error generating speech:', error.response?.status, error.response?.data || error.message);
    
    // Provide more helpful error messages
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key',
        message: 'Please check your ElevenLabs API key'
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'You have reached your ElevenLabs usage limit'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate speech',
        details: error.response?.data || error.message 
      });
    }
  }
});

// Get available voices from ElevenLabs
app.get('/api/elevenlabs/voices', async (req, res) => {
  try {
    const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch voices',
      details: error.response?.data || error.message 
    });
  }
});

// Save conversation
app.post('/api/conversations', (req, res) => {
  try {
    const { messages, voice_id } = req.body;
    
    const conversation = {
      id: uuidv4(),
      voice_id: voice_id,
      messages: messages,
      created_at: new Date().toISOString()
    };

    conversations.push(conversation);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// Get conversations
app.get('/api/conversations', (req, res) => {
  res.json(conversations);
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure to set your ELEVENLABS_API_KEY in the .env file');
}); 