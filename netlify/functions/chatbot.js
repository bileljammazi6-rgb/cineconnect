// Secure Netlify Function for OpenAI API
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { message } = JSON.parse(event.body);
    
    // Validate input
    if (!message || typeof message !== 'string' || message.length > 500) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid message' })
      };
    }

    // Call OpenAI API securely
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Secure environment variable
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful entertainment assistant for a movie/anime/series platform. You can recommend content, answer questions about movies and shows, help users discover new content, and provide general assistance. Be friendly, enthusiastic, and knowledgeable about entertainment. Keep responses under 300 words.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ response: botResponse })
    };

  } catch (error) {
    console.error('Chatbot function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'AI service temporarily unavailable',
        fallback: true
      })
    };
  }
};