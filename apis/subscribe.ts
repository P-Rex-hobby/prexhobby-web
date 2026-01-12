import request from "@/lib/request";

export async function subscribes(params: any) {
  return request({
    url: "/api/subscribes",
    method: "GET",
    params,
  });
}

export async function inboundPreorderInventory(productId: string) {
  return request({
    url: `/api/preorder-inbound/${productId}`,
    method: "POST",
  });
}
