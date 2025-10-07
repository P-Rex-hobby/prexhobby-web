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
  // Detect format based on first row
  const isDocumentFormat = useMemo(() => {
    return data.length > 0 && 'Document No.' in data[0];
  }, [data]);

  const isOrderFormat = useMemo(() => {
    if (data.length === 0) return false;
    const row = data[0] as Record<string, unknown>;
    return 'Order ID' in row || 'Product Name' in row;
  }, [data]);
  // Process data deduplication and summation
  const processedData = useMemo(() => {
    const barcodeMap = new Map<string, number>();
    const skuMap = new Map<string, number>();
    
    // Use the format detection from parent component
    const isDocumentFormatInner = data.length > 0 && 'Document No.' in data[0];
    const isOrderFormatInner = data.length > 0 && ('Order ID' in data[0] || 'Product Name' in data[0]);
    
    data.forEach((row) => {
      let barcode: string;
      let sku: string;
      let quantity: number;
      
      if (isDocumentFormatInner) {
        // Document format: Item No. = barcode, no SKU field, use Quantity
        barcode = row['Item No.']?.toString();
        sku = ''; // Document format doesn't have SKU, will be resolved by backend
        quantity = parseInt(row.Quantity) || 0;
      } else if (isOrderFormatInner) {
        barcode = row['Barcode']?.toString() || row['Variant Barcode [ID]']?.toString();
        sku = row['SKU']?.toString();
        quantity = parseInt(row['Qty Filled']) || parseInt(row['Quantity']) || 0;
      } else {
        // Traditional CSV format
        barcode = row.Barcode?.toString();
        sku = row.SKU?.toString();
        quantity = parseInt(row.Filled) || 0;
      }
      
      if (barcode) {
        barcodeMap.set(barcode, (barcodeMap.get(barcode) || 0) + quantity);
      }
      
      if (sku) {
        skuMap.set(sku, (skuMap.get(sku) || 0) + quantity);
      }
    });
    
    // Filter out records with quantity 0
    const barcodeData = Array.from(barcodeMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([barcode, count]) => ({ barcode, count }));
      
    const skuData = Array.from(skuMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([sku, count]) => ({ sku, count }));
    
    return { 
      barcodeData, 
      skuData,
      isDocumentFormat: isDocumentFormatInner 
    };
  }, [data]);

  const stats = useMemo(() => {
    
    let uniqueProducts: number;
    let totalQuantity: number;
    
    if (isDocumentFormat) {
      uniqueProducts = new Set(data.map(row => row['Item No.'])).size;
      totalQuantity = data.reduce((sum, row) => sum + (parseInt(row.Quantity) || 0), 0);
    } else if (isOrderFormat) {
      uniqueProducts = new Set(data.map(row => row.SKU || row['Barcode'])).size;
      totalQuantity = data.reduce((sum, row) => sum + (parseInt(row['Qty Filled']) || parseInt(row['Quantity']) || 0), 0);
    } else {
      uniqueProducts = new Set(data.map(row => row.SKU)).size;
      totalQuantity = data.reduce((sum, row) => sum + (parseInt(row.Filled) || 0), 0);
    }
    
    const outputRows = isDocumentFormat 
      ? processedData.barcodeData.length  // Document format: only barcode data matters
      : processedData.barcodeData.length + processedData.skuData.length;
    
    return {
      totalRows: data.length,
      uniqueProducts,
      totalQuantity,
      outputRows
    };
  }, [data, processedData, isDocumentFormat, isOrderFormat]);

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
              <p className="text-2xl font-bold text-purple-600">{stats.totalQuantity}</p>
              <p className="text-sm text-muted-foreground">Total Quantity</p>
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
                  {isDocumentFormat ? (
                    <>
                      <TableHead>Document No.</TableHead>
                      <TableHead>Document Date</TableHead>
                      <TableHead>Item No. (Barcode)</TableHead>
                      <TableHead>Vendor Item No.</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </>
                  ) : isOrderFormat ? (
                    <>
                      <TableHead>Order ID</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">Qty Ordered</TableHead>
                      <TableHead className="text-right">Qty Filled</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead>Order Type</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Filled</TableHead>
                      <TableHead>Price</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 20).map((row, index) => (
                  <TableRow key={index}>
                    {isDocumentFormat ? (
                      <>
                        <TableCell className="font-mono text-sm">{row['Document No.']}</TableCell>
                        <TableCell>{row['Document Date']}</TableCell>
                        <TableCell className="font-mono text-sm">{row['Item No.']}</TableCell>
                        <TableCell className="font-mono text-sm">{row['Vendor Item No.']}</TableCell>
                        <TableCell className="max-w-48 truncate" title={row.Product}>
                          {row.Product}
                        </TableCell>
                        <TableCell className="text-right">{row['Unit Price']}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={parseInt(row.Quantity) > 0 ? "default" : "secondary"}>
                            {row.Quantity}
                          </Badge>
                        </TableCell>
                      </>
                    ) : isOrderFormat ? (
                      <>
                        <TableCell className="font-mono text-sm">{row['Order ID']}</TableCell>
                        <TableCell className="font-mono text-sm">{row['SKU']}</TableCell>
                        <TableCell className="font-mono text-sm">{row['Barcode']}</TableCell>
                        <TableCell className="max-w-48 truncate" title={row['Product Name']}>
                          {row['Product Name']}
                        </TableCell>
                        <TableCell className="text-right">{row['Qty Ordered']}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={parseInt(row['Qty Filled']) > 0 ? "default" : "secondary"}>
                            {row['Qty Filled']}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{row['Unit Price']}</TableCell>
                        <TableCell>{row['Order Type']}</TableCell>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
            {isDocumentFormat ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Badge variant="outline" className="text-sm">Document Format</Badge>
                </div>
                <p className="text-muted-foreground mb-2">
                  SKU data will be generated after processing
                </p>
                <p className="text-sm text-muted-foreground">
                  The system will query barcode to find corresponding SKUs from the database.
                  <br />
                  Only items with valid SKUs will appear in the final Banma file.
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-48 w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>本地SKU(必填)</TableHead>
                        <TableHead className="text-right">数量(必填)</TableHead>
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
              </>
            )}
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
