// This is a Netlify serverless function.
// Its job is to securely return the Google Maps API key.

exports.handler = async (event, context) => {
  // Get the API key from the environment variables set in Netlify's UI.
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Google Maps API key is not set on the server.' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ apiKey: apiKey }),
  };
};
