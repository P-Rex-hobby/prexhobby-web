"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/biz/data-table/data-table-column-header";
import { TColumn } from "@/components/biz/data-table";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { inboundPreorderInventory } from "@/apis/subscribe";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import type { AxiosError } from "axios";

type PreorderInboundResponse = {
  productId: string;
  sku: string;
  targetPreorderInventory: number;
  inboundAlreadyQty: number;
  inboundDeltaQty: number;
  inboundAfterQty: number;
};

function normalizePreorderInboundResponse(input: any): PreorderInboundResponse {
  const res = input?.data ?? input ?? {};
  return {
    productId: res.productId ?? res.ProductID ?? res.product_id ?? "",
    sku: res.sku ?? res.SKU ?? "",
    targetPreorderInventory:
      res.targetPreorderInventory ??
      res.TargetPreorderInventory ??
      res.target_preorder_inventory ??
      0,
    inboundAlreadyQty:
      res.inboundAlreadyQty ?? res.InboundAlreadyQty ?? res.inbound_already_qty ?? 0,
    inboundDeltaQty:
      res.inboundDeltaQty ?? res.InboundDeltaQty ?? res.inbound_delta_qty ?? 0,
    inboundAfterQty:
      res.inboundAfterQty ?? res.InboundAfterQty ?? res.inbound_after_qty ?? 0,
  };
}

export type SubscribeItem = {
  id: string;
  product: {
    id: string;
    preorderInventory: number | null;
    preorderInventoryInboundQty?: number | null;
    preorderInventoryRealQty?: number | null;
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

function InboundButton({ productId, delta }: { productId: string; delta: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async () => {
      const raw = await inboundPreorderInventory(productId);
      return normalizePreorderInboundResponse(raw);
    },
    onSuccess: (res) => {
      // Optimistic update for the current table data so UI reflects immediately,
      // even if refetch is delayed.
      queryClient.setQueriesData({ queryKey: ["subscribes"] }, (old: any) => {
        if (!old || !Array.isArray(old.subscribes)) return old;
        const next = {
          ...old,
          subscribes: old.subscribes.map((item: SubscribeItem) => {
            if (item?.product?.id !== productId) return item;
            return {
              ...item,
              product: {
                ...item.product,
                preorderInventoryInboundQty: res?.inboundAfterQty ?? item.product.preorderInventoryInboundQty,
              },
            };
          }),
        };
        return next;
      });

      queryClient.invalidateQueries({ queryKey: ["subscribes"], refetchType: "active" });
      toast({
        title: "入库成功",
        description: `本次入库 ${res?.inboundDeltaQty ?? 0}，已入库 ${res?.inboundAfterQty ?? 0}`,
      });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<any>;
      const serverMsg =
        axiosErr?.response?.data?.error ||
        axiosErr?.response?.data?.message ||
        axiosErr?.message;
      toast({
        variant: "destructive",
        title: "入库失败",
        description: serverMsg || "请求失败",
      });
    },
  });

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={delta <= 0 || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "入库中..." : "入库"}
    </Button>
  );
}

export const columns: TColumn<SubscribeItem, unknown>[] = [
  {
    id: "sku",
    accessorKey: "product.sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => {
      return (
        <Link 
        target="_blank" 
        href={`https://ca.universaldist.com/item/detail/${row.original.product.sku}`} 
        className="underline underline-offset-4 truncate hover:text-blue-600"
      >
        {row.original.product.sku}
      </Link>
      );
    },
    enableSorting: false,
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
  {
    id: "preorderInventory",
    accessorKey: "product.preorderInventory",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Placed Inventory" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold">
            {row.original.product.preorderInventory || 0}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: "preorderInventoryRealQty",
    accessorKey: "product.preorderInventoryRealQty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Allocated Inventory" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold">
            {row.original.product.preorderInventoryRealQty || 0}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: "preorderInventoryInboundQty",
    accessorKey: "product.preorderInventoryInboundQty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="已入库" />
    ),
    cell: ({ row }) => {
      const qty = row.original.product.preorderInventoryInboundQty || 0;
      return (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-semibold">
            {qty}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">操作</div>,
    cell: ({ row }) => {
      const preorderInventoryRealQty = row.original.product.preorderInventoryRealQty || 0;
      const inboundQty = row.original.product.preorderInventoryInboundQty || 0;
      const delta = Math.max(0, preorderInventoryRealQty - inboundQty);
      return (
        <div className="flex justify-end gap-2">
          <InboundButton productId={row.original.product.id} delta={delta} />
        </div>
      );
    },
    enableSorting: false,
  },
  
]; 
