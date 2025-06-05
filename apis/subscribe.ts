export async function subscribes(params: any) {
  const searchParams = new URLSearchParams(params);
  const url = `/api/subscribes?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch subscribes');
  }
  
  return response.json();
} 