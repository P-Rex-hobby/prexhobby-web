"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, Clock } from "lucide-react";
import { downloadCSVFile } from "@/apis/csv";

interface DownloadLinksProps {
  downloadUrls: string[];
  taskId: string;
  onDownload: (url: string, filename: string) => void;
}

export default function DownloadLinks({ downloadUrls, taskId, onDownload }: DownloadLinksProps) {
  const getFileInfo = (url: string) => {
    const filename = url.split("/").pop() || "";
    if (filename.includes("shopify")) {
      return {
        name: "Shopify Inventory File",
        description: "Variant Barcode + Inventory Available",
        color: "bg-green-500"
      };
    } else if (filename.includes("banma")) {
      return {
        name: "Banma Inventory File",
        description: "Local SKU + Quantity",
        color: "bg-blue-500"
      };
    }
    return {
      name: "Unknown File",
      description: "",
      color: "bg-gray-500"
    };
  };

  const handleDownload = (url: string) => {
    const filename = url.split("/").pop() || "file.xlsx";
    const fullUrl = downloadCSVFile(taskId, filename);
    onDownload(fullUrl, filename);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Download Processing Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {downloadUrls.map((url, index) => {
            const fileInfo = getFileInfo(url);
            const filename = url.split("/").pop() || "";
            
            return (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${fileInfo.color}`} />
                      <h3 className="font-medium">{fileInfo.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {fileInfo.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {filename}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(url)}
                    size="sm"
                    className="shrink-0"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <Clock className="h-4 w-4" />
            <span>Files will be automatically deleted after 24 hours, please download promptly</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
