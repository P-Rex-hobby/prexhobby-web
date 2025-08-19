"use client";
import { DataTableColumnHeader } from "@/components/biz/data-table/data-table-column-header";
import Link from "next/link";
import { TColumn } from "@/components/biz/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
export type OrderItem = {
  id: string;
  ordered?: number;
  quantity: number;
  productName: string;
  sku: string;
  barcode: string;
  product: any;
  qty?: string;
};
export default function columns(onButtonClick: (key: string) => void) {
  const columns: TColumn<OrderItem, unknown>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => {
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className={`translate-y-[2px]`}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <Link
            target="_blank"
            href={`https://www.plamod.com/retailer/search?q=${row.original.barcode}`}
            className="underline underline-offset-4"
          >
            {row.original.productName}
          </Link>
        );
      },
      enableSorting: false,
    },
    {
      id: "sku",
      accessorKey: "sku",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="SKU" />
      ),
      cell: ({ row }) => row.getValue("sku"),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "barcode",
      accessorKey: "barcode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Barcode" />
      ),
      cell: ({ row }) => {
        const barcode = row.original.barcode;
        const url = `https://admin.shopify.com/store/aot-supply/products?query=${barcode}`;
        return (
          <Link
            target="_blank"
            href={url}
            className="underline underline-offset-4"
          >
            {barcode}
          </Link>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    //volume
    {
      id: "volume",
      accessorKey: "specification",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Volume" />
      ),
      cell: ({ row }) => {
        return row.original.product.specification;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "weight",
      accessorKey: "weight",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Weight" />
      ),
      cell: ({ row }) => {
        return row.original.product.weight;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "ordered",
      accessorKey: "ordered",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ordered" />
      ),
      cell: ({ row }) => row.getValue("ordered"),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "quantity",
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fill" />
      ),
      cell: ({ row }) => row.getValue("quantity"),
      enableSorting: false,
      enableHiding: false,
    },
    //add an input field to the cell
    {
      id: "qty",
      accessorKey: "qty",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Qty" />
      ),
      cell: ({ row }) => {
        return (
          <Input
            type="number"
            value={row.original.qty}
            onChange={(e) => (row.original.qty = e.target.value)}
          />
        );
      },
      meta: {
        width: 100,
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
  return columns;
}
