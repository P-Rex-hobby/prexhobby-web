"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, BarChart3 } from "lucide-react";

interface DataPreviewProps {
  data: any[];
  onStartProcess: () => void;
  onUpload: (file: File) => void;
}

export default function DataPreview({ data, onStartProcess, onUpload }: DataPreviewProps) {
  // Process data deduplication and summation
  const processedData = useMemo(() => {
    const barcodeMap = new Map<string, number>();
    const skuMap = new Map<string, number>();
    
    data.forEach((row) => {
      const barcode = row.Barcode?.toString();
      const sku = row.SKU?.toString();
      const filled = parseInt(row.Filled) || 0;
      
      if (barcode) {
        barcodeMap.set(barcode, (barcodeMap.get(barcode) || 0) + filled);
      }
      
      if (sku) {
        skuMap.set(sku, (skuMap.get(sku) || 0) + filled);
      }
    });
    
    // Filter out records with quantity 0
    const barcodeData = Array.from(barcodeMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([barcode, count]) => ({ barcode, count }));
      
    const skuData = Array.from(skuMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([sku, count]) => ({ sku, count }));
    
    return { barcodeData, skuData };
  }, [data]);

  const stats = {
    totalRows: data.length,
    uniqueProducts: new Set(data.map(row => row.SKU)).size,
    totalFilled: data.reduce((sum, row) => sum + (parseInt(row.Filled) || 0), 0),
    outputRows: processedData.barcodeData.length + processedData.skuData.length
  };

  return (
    <div className="space-y-6">
      {/* Data Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.totalRows}</p>
              <p className="text-sm text-muted-foreground">Original Records</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.uniqueProducts}</p>
              <p className="text-sm text-muted-foreground">Unique Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalFilled}</p>
              <p className="text-sm text-muted-foreground">Total Filled Quantity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.outputRows}</p>
              <p className="text-sm text-muted-foreground">Output Records</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Original Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Original Data Preview (First 20 rows)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Filled</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 20).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline">{row.Category}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{row.SKU}</TableCell>
                    <TableCell className="font-mono text-sm">{row.Barcode}</TableCell>
                    <TableCell className="max-w-48 truncate" title={row.Name}>
                      {row.Name}
                    </TableCell>
                    <TableCell className="text-right">{row.Ordered}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={parseInt(row.Filled) > 0 ? "default" : "secondary"}>
                        {row.Filled}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.Price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {data.length > 20 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Showing first 20 rows, total {data.length} rows
            </p>
          )}
        </CardContent>
      </Card>

      {/* Processed Data Preview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Shopify File Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Shopify Inventory File Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant Barcode [ID]</TableHead>
                    <TableHead className="text-right">Inventory Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.barcodeData.slice(0, 10).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{item.barcode}</TableCell>
                      <TableCell className="text-right">
                        <Badge>{item.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Showing first 10 rows, total {processedData.barcodeData.length} rows
            </p>
          </CardContent>
        </Card>

        {/* Banma File Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Banma Inventory File Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Local SKU (Required)</TableHead>
                    <TableHead className="text-right">Quantity (Required)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.skuData.slice(0, 10).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="text-right">
                        <Badge>{item.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Showing first 10 rows, total {processedData.skuData.length} rows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button size="lg" onClick={onStartProcess}>
          Confirm Data Processing
        </Button>
      </div>
    </div>
  );
}
