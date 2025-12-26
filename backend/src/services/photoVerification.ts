import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const verifyPhoto = async (imageUrl: string): Promise<{verified: boolean, reason?: string}> => {
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
      return { verified: false, reason: 'No response from verification service' };
    }

    // Parse JSON response
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error('Photo verification error:', error);
    return { verified: false, reason: 'Verification service error' };
  }
};
