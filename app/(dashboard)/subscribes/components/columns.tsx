"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/biz/data-table/data-table-column-header";
import { TColumn } from "@/components/biz/data-table";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";

export type SubscribeItem = {
  id: string;
  product: {
    id: string;
    sku: string;
    barcode: string;
    title: string;
    preorderCutoffDate: string | null;
    featuredImage: {
      url: string;
      altText: string;
    };
  };
  count: number;
};

export const columns: TColumn<SubscribeItem, unknown>[] = [
  {
    id: "sku",
    accessorKey: "product.sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.product.sku}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: "title",
    accessorKey: "product.title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="max-w-[300px]">
          <div className="flex items-center gap-2">
            {row.original.product.featuredImage?.url && (
              <img 
                src={row.original.product.featuredImage.url} 
                alt={row.original.product.featuredImage.altText}
                className="w-10 h-10 object-cover rounded"
              />
            )}
            <Link 
              target="_blank" 
              href={`https://admin.shopify.com/store/aot-supply/products/${row.original.product.id}`} 
              className="underline underline-offset-4 truncate hover:text-blue-600"
            >
              {row.original.product.title}
            </Link>
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "barcode",
    accessorKey: "product.barcode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barcode" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-mono text-sm">
          {row.original.product.barcode || "-"}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "preorderCutoffDate",
    accessorKey: "product.preorderCutoffDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preorder Cutoff Date" />
    ),
    cell: ({ row }) => {
      const cutoffDate = row.original.product.preorderCutoffDate;
      if (!cutoffDate) return <span className="text-gray-400">-</span>;
      
      const cutoffDateTime = new Date(cutoffDate);
      const now = new Date();
      const daysUntilCutoff = differenceInDays(cutoffDateTime, now);
      
      // 如果截止日期在3天内，标黄
      const isWithin3Days = daysUntilCutoff >= 0 && daysUntilCutoff <= 3;
      
      return (
        <div className={`text-sm px-2 py-1 rounded ${isWithin3Days ? 'bg-yellow-200 text-yellow-800' : ''}`}>
          {format(cutoffDateTime, "yyyy-MM-dd")}
          {isWithin3Days && (
            <span className="ml-1 text-xs">
              ({daysUntilCutoff === 0 ? 'Today' : `${daysUntilCutoff}d left`})
            </span>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: "count",
    accessorKey: "count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subscribe Count" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold">
            {row.original.count}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
]; 