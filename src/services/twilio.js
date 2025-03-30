/**
 * Send a message using Twilio
 * Endpoint: https://cc.automate8.com/send-sms
 */
export const sendTwilioMessage = async ({ to, message }) => {
  try {
    const response = await fetch('https://cc.automate8.com/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
