"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";

interface ProcessStatusProps {
  state: "uploading" | "processing" | string;
  message?: string;
}

export default function ProcessStatus({ state, message }: ProcessStatusProps) {
  const getProgress = () => {
    switch (state) {
      case "uploading":
        return 25;
      case "processing":
        return 75;
      default:
        return 0;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "uploading":
        return "Uploading file...";
      case "processing":
        return "Processing data...";
      default:
        return "Processing...";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{getStatusText()}</span>
            <span className="text-sm text-muted-foreground">{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="w-full" />
        </div>
        
        {message && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{message}</p>
          </div>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {state === "uploading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            File Upload
          </div>
          <div className="flex items-center gap-2">
            {state === "processing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : state === "uploading" ? (
              <Clock className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            Data Processing
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            File Generation
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
