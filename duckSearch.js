exports.handler = async function(event, context) {
  const query = event.queryStringParameters.q || 'test';

  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        heading: data.Heading,
        abstract: data.Abstract,
        relatedTopics: data.RelatedTopics
      })
    };
  } catch (error) {
    console.error('DuckDuckGo Instant Answer error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'DuckDuckGo request failed' })
    };
  }
};
