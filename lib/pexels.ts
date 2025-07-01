const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export interface PexelsImage {
  id: number;
  src: {
    medium: string;
    large: string;
  };
  alt: string;
}

export interface PexelsResponse {
  photos: PexelsImage[];
}

export async function searchPexelsImage(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API key not found');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status, response.statusText);
      return null;
    }

    const data: PexelsResponse = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium;
    }

    return null;
  } catch (error) {
    console.error('Error fetching image from Pexels:', error);
    return null;
  }
} 