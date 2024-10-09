import axios from 'axios';

const OPENAI_API_KEY = "5e00cfbd63d6408c880d9f380a2daaca";
const OPENAI_BASE_URL = "https://meow-openai.openai.azure.com/openai/deployments";
const GPT_ENDPOINT = `${OPENAI_BASE_URL}/gpt-4o/chat/completions?api-version=2024-08-01-preview`;
const DALL_E_ENDPOINT = `${OPENAI_BASE_URL}/dall-e-3/images/generations?api-version=2024-02-01`;

const VISION_API_KEY = "3518f3783143406abda726de5a041a8e";
const VISION_ENDPOINT = "https://dekhnevaliapi.cognitiveservices.azure.com/";

const openaiHeaders = {
  "Content-Type": "application/json",
  "api-key": OPENAI_API_KEY
};

const visionHeaders = {
  "Content-Type": "application/octet-stream",
  "Ocp-Apim-Subscription-Key": VISION_API_KEY
};

export const extractTextFromImage = async (imageFile: File): Promise<string> => {
  try {
    const imageData = await imageFile.arrayBuffer();
    const response = await axios.post(
      `${VISION_ENDPOINT}vision/v3.2/read/analyze`,
      imageData,
      {
        headers: visionHeaders,
      }
    );

    const operationLocation = response.headers['operation-location'];
    let readResults = null;

    if (operationLocation) {
      let done = false;
      while (!done) {
        const readResponse = await axios.get(operationLocation, {
          headers: visionHeaders,
        });

        if (readResponse.data.status === 'succeeded') {
          readResults = readResponse.data.analyzeResult.readResults;
          done = true;
        } else if (readResponse.data.status === 'failed') {
          throw new Error('Text extraction failed.');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Polling interval
        }
      }
    }

    if (readResults) {
      let extractedText = '';
      readResults.forEach((result: any) => {
        result.lines.forEach((line: any) => {
          extractedText += line.text + '\n';
        });
      });
      return extractedText.trim();
    } else {
      throw new Error('No text found in the image.');
    }
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Unable to extract text from the image.');
  }
};

export const describeImage = async (imageFile: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await axios.post(
      `${VISION_ENDPOINT}vision/v3.2/analyze?visualFeatures=Description`,
      imageFile, // Send binary data directly
      {
        headers: {
          ...visionHeaders,
          'Content-Type': 'application/octet-stream',
        },
      }
    );

    // Log the full response for debugging
    console.log('Full Vision API response:', response.data);

    // Check if the response contains the expected data
    if (response.data && response.data.description && response.data.description.captions && response.data.description.captions.length > 0) {
      console.log('Extracted description from response:', response.data.description.captions[0].text);
      return response.data.description.captions[0].text;
    } else {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Vision API did not return a valid description.');
    }

  } catch (error) {
    console.error('Error describing image:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error response from Vision API:', error.response.data);
      throw new Error(`Vision API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error('Unable to describe the image due to an error.');
  }
};


export const sendMessage = async (message: string, imageDescription?: string, extractedText?: string): Promise<string> => {
  let fullMessage = message;
  if (imageDescription) {
    fullMessage += `\n\nImage description: ${imageDescription}`;
  }
  if (extractedText) {
    fullMessage += `\n\nExtracted text from image:\n${extractedText}`;
  }

  let messages = [
    {
      role: "system",
      content: "You are an AI assistant that helps people find detailed information on web-browsers or from the context they provide or attach to you with markdown support. If the user asks for an image, respond with the text 'GENERATE_IMAGE: ' followed by a detailed prompt for DALL-E 3 to generate the requested image."
    },
    {
      role: "user",
      content: fullMessage
    }
  ];

  const payload = {
    messages,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 4000
  };

  try {
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    const response = await axios.post(GPT_ENDPOINT, payload, { headers: openaiHeaders });
    
    // Check if the response contains a valid message
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      console.log('Received response:', response.data);
      return response.data.choices[0].message.content;
    } else {
      throw new Error('GPT-4o response did not return valid content.');
    }

  } catch (error) {
    console.error('Error sending message:', error);

    // Check if error is Axios-related
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(`OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
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
    const response = await axios.post(DALL_E_ENDPOINT, payload, { headers: openaiHeaders });
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
        if (file.type.startsWith('image/')) {
          // For image files, return the full data URL
          resolve(event.target.result as string);
        } else {
          // For text files, return the content as is
          resolve(event.target.result as string);
        }
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error('Error reading file'));
    };
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file); // Ensures correct format for images
    } else {
      reader.readAsText(file);
    }
  });
};
