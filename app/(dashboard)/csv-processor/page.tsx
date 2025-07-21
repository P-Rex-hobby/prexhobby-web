"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { uploadCSV, getCSVStatus, downloadCSVFile, triggerDownload, type CSVUploadResponse } from "@/apis/csv";
import CSVUploader from "./components/CSVUploader";
import DataPreview from "./components/DataPreview";
import ProcessStatus from "./components/ProcessStatus";
import DownloadLinks from "./components/DownloadLinks";

type ProcessState = "idle" | "uploading" | "preview" | "processing" | "completed" | "error";

export default function CSVProcessorPage() {
  const [processState, setProcessState] = useState<ProcessState>("idle");
  const [uploadResult, setUploadResult] = useState<CSVUploadResponse | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // 上传CSV文件
  const uploadMutation = useMutation({
    mutationFn: uploadCSV,
    onMutate: () => {
      setProcessState("uploading");
      setError(null);
    },
    onSuccess: (data) => {
      setUploadResult(data);
      if (data.status === "completed") {
        setProcessState("completed");
      } else {
        setProcessState("processing");
      }
      toast.success("File uploaded successfully!");
    },
    onError: (error: any) => {
      setProcessState("error");
      const errorMessage = error?.response?.data?.error || "File upload failed";
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // 轮询处理状态
  const { data: statusData } = useQuery({
    queryKey: ["csv-status", uploadResult?.task_id],
    queryFn: () => getCSVStatus(uploadResult!.task_id),
    enabled: !!uploadResult?.task_id && processState === "processing",
    refetchInterval: 2000, // 每2秒轮询一次
  });

  // Handle status changes
  React.useEffect(() => {
    if (statusData) {
      if (statusData.status === "completed") {
        setProcessState("completed");
        setUploadResult(prev => prev ? { ...prev, download_urls: statusData.download_urls || [] } : null);
        toast.success("File processing completed!");
      } else if (statusData.status === "failed") {
        setProcessState("error");
        setError(statusData.message);
        toast.error("File processing failed!");
      }
    }
  }, [statusData]);

  const handleFileSelect = useCallback((file: File, data: any[]) => {
    setCsvData(data);
    setCurrentFile(file);
    setProcessState("preview");
  }, []);

  const handleStartProcess = useCallback(() => {
    if (csvData.length === 0) {
      toast.error("Please upload a CSV file first");
      return;
    }
    // File upload will be handled in CSVUploader component
  }, [csvData]);

  const handleDownload = useCallback((url: string, filename: string) => {
    triggerDownload(url, filename);
    toast.success(`Starting download: ${filename}`);
  }, []);

  const handleReset = useCallback(() => {
    setProcessState("idle");
    setUploadResult(null);
    setCsvData([]);
    setCurrentFile(null);
    setError(null);
    uploadMutation.reset(); // Reset mutation state
  }, [uploadMutation]);

  const handleRetry = useCallback(() => {
    if (currentFile) {
      uploadMutation.mutate(currentFile);
    } else {
      toast.error("No file available to retry");
    }
  }, [currentFile, uploadMutation]);

  const getStateIcon = () => {
    switch (processState) {
      case "uploading":
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStateText = () => {
    switch (processState) {
      case "idle":
        return "Waiting for upload";
      case "uploading":
        return "Uploading...";
      case "preview":
        return "Data preview";
      case "processing":
        return "Processing...";
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
      default:
        return "Unknown status";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">CSV File Processor</h1>
          <p className="text-muted-foreground">
            Upload CSV files and automatically generate Shopify and Banma inventory files
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStateIcon()}
          <Badge variant={processState === "completed" ? "default" : processState === "error" ? "destructive" : "secondary"}>
            {getStateText()}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Upload Area */}
      <CSVUploader
        onFileSelect={handleFileSelect}
        onUpload={uploadMutation.mutate}
        disabled={processState === "uploading" || processState === "processing"}
        processState={processState}
      />

      {/* Data Preview */}
      {processState === "preview" && csvData.length > 0 && (
        <DataPreview 
          data={csvData} 
          onStartProcess={handleStartProcess}
          onUpload={uploadMutation.mutate}
        />
      )}

      {/* Processing Status */}
      {(processState === "processing" || processState === "uploading") && (
        <ProcessStatus 
          state={processState}
          message={uploadResult?.message || statusData?.message}
        />
      )}

      {/* Download Links */}
      {processState === "completed" && uploadResult?.download_urls && (
        <DownloadLinks 
          downloadUrls={uploadResult.download_urls}
          taskId={uploadResult.task_id}
          onDownload={handleDownload}
        />
      )}

      {/* Action Buttons */}
      {(processState === "completed" || processState === "error") && (
        <div className="flex justify-center gap-4">
          {processState === "error" && currentFile && (
            <Button 
              onClick={handleRetry}
              variant="default"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Processing..." : "Retry Processing"}
            </Button>
          )}
          <Button onClick={handleReset} variant="outline">
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
