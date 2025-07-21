"use client";

import { useCallback, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CSVUploaderProps {
  onFileSelect: (file: File, data: any[]) => void;
  onUpload: (file: File) => void;
  disabled?: boolean;
  processState: string;
}

export default function CSVUploader({ onFileSelect, onUpload, disabled, processState }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validate required columns for different file formats
        if (jsonData.length > 0) {
          const firstRow = jsonData[0] as any;
          const columns = Object.keys(firstRow);
          
          // Check if it's Document format (contains "Document No.")
          const isDocumentFormat = columns.includes("Document No.");
          
          let requiredColumns: string[];
          if (isDocumentFormat) {
            // Document format columns
            requiredColumns = ["Document No.", "Document Date", "Item No.", "Vendor Item No.", "Product", "Unit Price", "Quantity"];
          } else {
            // Traditional CSV format columns  
            requiredColumns = ["Category", "SKU", "Barcode", "Name", "Ordered", "Filled", "Price", "Tariff", "Subtotal"];
          }
          
          const missingColumns = requiredColumns.filter(col => !(col in firstRow));
          
          if (missingColumns.length > 0) {
            const formatType = isDocumentFormat ? "Document format" : "CSV format";
            setParseError(`Missing required columns for ${formatType}: ${missingColumns.join(", ")}`);
            return;
          }
        }
        
        setParseError(null);
        onFileSelect(file, jsonData);
      } catch (error) {
        setParseError("File parsing failed, please check file format");
      }
    };
    reader.readAsBinaryString(file);
  }, [onFileSelect]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Validate file type
      const allowedTypes = ['.csv', '.xls', '.xlsx'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        setParseError("Unsupported file format, please upload .csv, .xls or .xlsx files");
        return;
      }
      
      // Validate file size
      if (selectedFile.size > 10 * 1024 * 1024) {
        setParseError("File size exceeds 10MB limit");
        return;
      }
      
      setFile(selectedFile);
      parseCSVFile(selectedFile);
    }
    
    // Reset file input to allow reselecting the same file
    event.target.value = '';
  }, [parseCSVFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      
      // Validate file type
      const allowedTypes = ['.csv', '.xls', '.xlsx'];
      const fileExtension = droppedFile.name.toLowerCase().substring(droppedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        setParseError("Unsupported file format, please upload .csv, .xls or .xlsx files");
        return;
      }
      
      // Validate file size
      if (droppedFile.size > 10 * 1024 * 1024) {
        setParseError("File size exceeds 10MB limit");
        return;
      }
      
      setFile(droppedFile);
      parseCSVFile(droppedFile);
    }
  }, [parseCSVFile]);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragActive ? "Drop files here" : "Drag & drop or click to upload CSV file"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Supports .csv, .xls, .xlsx formats, max 10MB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Information */}
      {file && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {processState === "preview" && (
                <Button onClick={handleUpload} disabled={disabled}>
                  Start Processing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parse Error */}
      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
