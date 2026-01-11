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

export async function inboundPreorderInventory(productId: string) {
  const response = await fetch(`/api/preorder-inbound/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    try {
      const body = text ? JSON.parse(text) : null;
      throw new Error(body?.error || "Failed to inbound preorder inventory");
    } catch {
      throw new Error(text || "Failed to inbound preorder inventory");
    }
  }

  return response.json();
}
