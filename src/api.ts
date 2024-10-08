import axios from 'axios';

const API_KEY = "xxxxx";
const BASE_URL = "https://meow-openai.openai.azure.com/openai/deployments";
const GPT_ENDPOINT = `${BASE_URL}/gpt-4o/chat/completions?api-version=2024-08-01-preview`;
const DALL_E_ENDPOINT = `${BASE_URL}/dall-e-3/images/generations?api-version=2024-02-01`;

const headers = {
  "Content-Type": "application/json",
  "api-key": API_KEY
};

export const sendMessage = async (message: string): Promise<string> => {
  const payload = {
    messages: [
      {
        role: "system",
        content: "You are an AI assistant that helps people find detailed information on web-browsers or from the context they provide or attach to you. If the user asks for an image, respond with the text 'GENERATE_IMAGE: ' followed by a detailed prompt for DALL-E 3 to generate the requested image."
      },
      {
        role: "user",
        content: message
      }
    ],
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 3000
  };

  try {
    const response = await axios.post(GPT_ENDPOINT, payload, { headers });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error sending message:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('No response received from the server. Please check your internet connection and try again.');
      }
    }
    throw new Error('An unexpected error occurred. Please try again later.');
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const payload = {
    prompt: prompt,
    n: 1,
    size: "1024x1024"
  };

  try {
    const response = await axios.post(DALL_E_ENDPOINT, payload, { headers });
    return response.data.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('No response received from the server. Please check your internet connection and try again.');
      }
    }
    throw new Error('An unexpected error occurred while generating the image. Please try again later.');
  }
};

export const uploadFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error('Error reading file'));
    };
    reader.readAsText(file);
  });
};
