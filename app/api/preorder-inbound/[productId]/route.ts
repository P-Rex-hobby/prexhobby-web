import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const apiBaseUrl =
      process.env.PREXHOBBY_API_BASE_URL || "http://localhost:9999";

    const response = await axios.post(
      `${apiBaseUrl}/api/preorder-inbound/${params.productId}`,
      null,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error inbound preorder inventory:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const data =
        error.response?.data ?? ({ error: error.message } as unknown);
      return NextResponse.json(data, { status });
    }
    return NextResponse.json(
      { error: "Failed to inbound preorder inventory" },
      { status: 500 }
    );
  }
}
