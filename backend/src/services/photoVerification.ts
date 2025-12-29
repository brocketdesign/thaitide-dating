import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

export interface PhotoVerificationResult {
  verified: boolean;
  reason?: string;
  isSafe: boolean;
  hasFace: boolean;
  isAdult: boolean;
  moderationFlags?: string[];
}

// Check image content using OpenAI moderation API
export const moderateImage = async (base64Image: string): Promise<{safe: boolean, flags: string[]}> => {
  if (!openai) {
    return { safe: true, flags: ['Moderation not configured'] };
  }

  try {
    // OpenAI moderation API for images
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: [
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    });

    const result = response.results[0];
    const flags: string[] = [];
    
    // Check all categories
    if (result.categories.sexual) flags.push('sexual');
    if (result.categories['sexual/minors']) flags.push('sexual/minors');
    if (result.categories.violence) flags.push('violence');
    if (result.categories['violence/graphic']) flags.push('violence/graphic');
    if (result.categories.hate) flags.push('hate');
    if (result.categories.harassment) flags.push('harassment');
    if (result.categories['self-harm']) flags.push('self-harm');

    return {
      safe: !result.flagged,
      flags
    };
  } catch (error) {
    console.error('Moderation error:', error);
    return { safe: true, flags: ['Moderation check failed'] };
  }
};

// Verify face in image using GPT-4 Vision
export const verifyFace = async (base64Image: string): Promise<{hasFace: boolean, isAdult: boolean, reason: string}> => {
  if (!openai) {
    return { hasFace: false, isAdult: false, reason: 'OpenAI API key not configured' };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a photo verification assistant for a dating app. Analyze profile photos for safety and authenticity. Always respond with valid JSON only, no markdown.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this profile photo and respond with JSON only:
{
  "hasFace": boolean (true if a human face is clearly visible),
  "isAdult": boolean (true if the person appears to be an adult, only set false if they CLEARLY look like a child under 16),
  "faceVisible": boolean (true if face is not obscured/hidden),
  "isRealPerson": boolean (true if real photo, not cartoon/drawing/AI-generated),
  "reason": string (brief explanation)
}

Important: Many adults have youthful appearances. Only reject if the person is OBVIOUSLY a young child or early teenager. Give the benefit of the doubt to adults who may look young. This is a dating app for adults 18+.`
            },
            {
              type: 'image_url',
              image_url: { 
                url: `data:image/jpeg;base64,${base64Image}` 
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { hasFace: false, isAdult: false, reason: 'No response from verification service' };
    }

    const result = JSON.parse(content);
    return {
      hasFace: result.hasFace && result.faceVisible && result.isRealPerson,
      isAdult: result.isAdult,
      reason: result.reason
    };
  } catch (error) {
    console.error('Face verification error:', error);
    return { hasFace: false, isAdult: false, reason: 'Verification service error' };
  }
};

// Complete photo verification
export const verifyPhoto = async (imageUrl: string): Promise<PhotoVerificationResult> => {
  if (!openai) {
    return { 
      verified: false, 
      reason: 'OpenAI API key not configured',
      isSafe: false,
      hasFace: false,
      isAdult: false
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this profile photo. Determine if it shows a real person\'s face (not a cartoon, drawing, celebrity, or inappropriate content). Respond with JSON: {verified: boolean, reason: string}'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 100
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { 
        verified: false, 
        reason: 'No response from verification service',
        isSafe: false,
        hasFace: false,
        isAdult: false
      };
    }

    const result = JSON.parse(content);
    return {
      ...result,
      isSafe: true,
      hasFace: result.verified,
      isAdult: true
    };
  } catch (error) {
    console.error('Photo verification error:', error);
    return { 
      verified: false, 
      reason: 'Verification service error',
      isSafe: false,
      hasFace: false,
      isAdult: false
    };
  }
};

// Full verification for uploaded image (base64)
export const verifyUploadedPhoto = async (base64Image: string): Promise<PhotoVerificationResult> => {
  // Step 1: Content moderation
  const moderation = await moderateImage(base64Image);
  
  if (!moderation.safe) {
    return {
      verified: false,
      reason: `Image flagged for: ${moderation.flags.join(', ')}`,
      isSafe: false,
      hasFace: false,
      isAdult: false,
      moderationFlags: moderation.flags
    };
  }

  // Step 2: Face verification
  const faceCheck = await verifyFace(base64Image);
  
  if (!faceCheck.hasFace) {
    return {
      verified: false,
      reason: faceCheck.reason || 'No clear face detected in the image',
      isSafe: true,
      hasFace: false,
      isAdult: false
    };
  }

  if (!faceCheck.isAdult) {
    return {
      verified: false,
      reason: 'The person in the photo must be 18 or older',
      isSafe: true,
      hasFace: true,
      isAdult: false
    };
  }

  return {
    verified: true,
    reason: faceCheck.reason,
    isSafe: true,
    hasFace: true,
    isAdult: true
  };
};

