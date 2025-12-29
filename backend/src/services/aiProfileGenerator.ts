import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const NOVITA_API_KEY = process.env.NOVITA_API_KEY;

// Thailand locations
const thaiLocations = [
  { coordinates: [100.5018, 13.7563] as [number, number], city: 'Bangkok', country: 'Thailand' },
  { coordinates: [98.9853, 18.7883] as [number, number], city: 'Chiang Mai', country: 'Thailand' },
  { coordinates: [98.3923, 7.8804] as [number, number], city: 'Phuket', country: 'Thailand' },
  { coordinates: [100.8771, 12.9236] as [number, number], city: 'Pattaya', country: 'Thailand' },
  { coordinates: [99.9940, 9.1382] as [number, number], city: 'Koh Samui', country: 'Thailand' },
];

interface GeneratedProfile {
  firstName: string;
  lastName: string;
  bio: string;
  interests: string[];
  languages: string[];
  education: 'high-school' | 'bachelor' | 'master' | 'phd' | 'other';
  englishAbility: 'beginner' | 'intermediate' | 'fluent' | 'native';
  height: number;
  weight: number;
  imagePrompt: string;
}

interface NovitaTaskResponse {
  task_id: string;
}

interface NovitaTaskResult {
  task: {
    task_id: string;
    status: string;
    reason?: string;
    progress_percent?: number;
  };
  images?: Array<{
    image_url: string;
    image_url_ttl: number;
    image_type: string;
  }>;
}

// Generate profile details using OpenAI
export async function generateProfileWithAI(gender: 'male' | 'female'): Promise<GeneratedProfile> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Generate a realistic dating profile for a ${gender} Thai person aged 25-35. 
Return ONLY a valid JSON object with these exact fields:
{
  "firstName": "Thai first name (romanized)",
  "lastName": "Thai last name (romanized)", 
  "bio": "Dating bio (2-3 sentences, casual and friendly, 100-200 chars)",
  "interests": ["5-7 interests from: Travel, Photography, Cooking, Music, Fitness, Reading, Movies, Beach, Hiking, Dancing, Art, Food, Yoga, Meditation, Gaming, Shopping, Nightlife, Coffee, Thai Culture, Languages, Animals, Nature"],
  "languages": ["2-3 languages from: Thai, English, Chinese, Japanese, Korean, French, German"],
  "education": "one of: high-school, bachelor, master, phd, other",
  "englishAbility": "one of: beginner, intermediate, fluent, native",
  "height": number between 155-180 for female or 165-185 for male (in cm),
  "weight": number appropriate for height (in kg),
  "imagePrompt": "Detailed prompt for generating a photorealistic portrait of this person for a dating app. Include: ethnicity (Thai/Southeast Asian), age range, gender, attractive appearance, natural smile, good lighting, casual setting. Make it specific but tasteful."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that generates realistic dating profile data. Always respond with valid JSON only, no markdown formatting.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.9,
    max_tokens: 1000
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  try {
    return JSON.parse(jsonStr) as GeneratedProfile;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Failed to parse profile data from OpenAI');
  }
}

// Start image generation with Novita AI
export async function startImageGeneration(prompt: string): Promise<string> {
  if (!NOVITA_API_KEY) {
    throw new Error('Novita API key not configured');
  }

  const response = await fetch('https://api.novita.ai/v3/async/flux-2-pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NOVITA_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      size: '512*512',
      seed: -1
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Novita API error: ${error}`);
  }

  const data = await response.json() as NovitaTaskResponse;
  return data.task_id;
}

// Check image generation status
export async function checkImageGeneration(taskId: string): Promise<NovitaTaskResult> {
  if (!NOVITA_API_KEY) {
    throw new Error('Novita API key not configured');
  }

  const response = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NOVITA_API_KEY}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Novita API error: ${error}`);
  }

  return await response.json() as NovitaTaskResult;
}

// Wait for image generation to complete
export async function waitForImage(taskId: string, maxAttempts: number = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await checkImageGeneration(taskId);
    
    if (result.task.status === 'TASK_STATUS_SUCCEED' && result.images && result.images.length > 0) {
      return result.images[0].image_url;
    }
    
    if (result.task.status === 'TASK_STATUS_FAILED') {
      throw new Error(`Image generation failed: ${result.task.reason || 'Unknown error'}`);
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Image generation timed out');
}

// Generate a random date of birth for age range
function generateRandomDate(minAge: number, maxAge: number): Date {
  const today = new Date();
  const minYear = today.getFullYear() - maxAge;
  const maxYear = today.getFullYear() - minAge;
  const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

// Create a complete AI-generated profile
export async function createAIGeneratedProfile(gender: 'male' | 'female') {
  // Step 1: Generate profile details with OpenAI
  console.log('🤖 Generating profile details with OpenAI...');
  const profileData = await generateProfileWithAI(gender);
  
  // Step 2: Start image generation with Novita
  console.log('🎨 Starting image generation with Novita AI...');
  const enhancedPrompt = `Professional dating app profile photo. ${profileData.imagePrompt}. High quality, natural lighting, friendly expression, looking at camera, upper body shot, clean background.`;
  const taskId = await startImageGeneration(enhancedPrompt);
  
  // Step 3: Wait for image to be ready
  console.log('⏳ Waiting for image generation...');
  const imageUrl = await waitForImage(taskId);
  
  // Step 4: Prepare complete profile data
  const location = thaiLocations[Math.floor(Math.random() * thaiLocations.length)];
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  
  const completeProfile = {
    clerkId: `ai_generated_${uniqueId}`,
    email: `ai_${uniqueId}@generated.local`,
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    profilePhoto: imageUrl,
    photos: [imageUrl],
    bio: profileData.bio,
    dateOfBirth: generateRandomDate(25, 35),
    gender: gender,
    lookingFor: gender === 'male' ? 'female' as const : 'male' as const,
    location: {
      type: 'Point' as const,
      coordinates: location.coordinates,
      city: location.city,
      country: location.country
    },
    languages: profileData.languages,
    interests: profileData.interests,
    height: profileData.height,
    weight: profileData.weight,
    education: profileData.education,
    englishAbility: profileData.englishAbility,
    verified: true,
    photoVerificationStatus: 'verified' as const,
    isPremium: Math.random() > 0.7,
    visibility: Math.floor(Math.random() * 10),
    isAI: true, // Mark as AI-generated profile
    likes: [],
    dislikes: [],
    matches: []
  };
  
  return completeProfile;
}

// Generate AI chat response based on conversation history and profile
export async function generateAIChatResponse(
  aiProfile: { firstName: string; bio: string; interests: string[]; gender: string },
  userProfile: { 
    firstName: string; 
    bio?: string; 
    interests?: string[]; 
    gender?: string;
    age?: number;
    location?: string;
  },
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  // Build user context string
  let userContext = `You are chatting with ${userProfile.firstName}`;
  if (userProfile.age) userContext += `, ${userProfile.age} years old`;
  if (userProfile.gender) userContext += `, ${userProfile.gender}`;
  if (userProfile.location) userContext += `, from ${userProfile.location}`;
  userContext += '.';
  
  if (userProfile.bio) {
    userContext += `\nTheir bio: "${userProfile.bio}"`;
  }
  if (userProfile.interests && userProfile.interests.length > 0) {
    userContext += `\nTheir interests: ${userProfile.interests.join(', ')}`;
  }

  const systemPrompt = `You are ${aiProfile.firstName}, a ${aiProfile.gender} Thai person on a dating app. 
Your bio: "${aiProfile.bio}"
Your interests: ${aiProfile.interests.join(', ')}

${userContext}

Be friendly, flirty but respectful, and authentic. 
Keep responses natural and conversational (1-3 sentences typically).
Sometimes use emojis but don't overdo it.
Show interest in the other person while sharing about yourself.
Reference shared interests when relevant.
Remember details they've shared - you already know their profile info so don't ask basic questions like their name or where they're from.
If asked about meeting in person, be open but suggest getting to know each other better first.
Never break character or reveal you are an AI.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.85,
    max_tokens: 200
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content.trim();
}
