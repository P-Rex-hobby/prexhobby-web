import request from "@/lib/request";

export interface CSVProcessResult {
  task_id: string;
  status: "processing" | "completed" | "failed";
  download_urls?: string[];
  expires_at?: string;
  message: string;
}

export interface CSVUploadResponse {
  task_id: string;
  status: string;
  download_urls: string[];
  expires_at: string;
  message: string;
}

// 上传CSV文件
export const uploadCSV = async (file: File): Promise<CSVUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  return request({
    url: "/api/csv/upload",
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 查询处理状态
export const getCSVStatus = async (taskId: string): Promise<CSVProcessResult> => {
  return request({
    url: `/api/csv/status/${taskId}`,
    method: "GET",
  });
};

// 下载文件
export const downloadCSVFile = (taskId: string, filename: string): string => {
  return `http://localhost:9999/api/csv/download/${taskId}/${filename}`;
};

// 触发文件下载
export const triggerDownload = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
