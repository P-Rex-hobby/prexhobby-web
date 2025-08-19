"use client"
import { DataTableColumnHeader } from "@/components/biz/data-table/data-table-column-header"
import Link from "next/link"
import { TColumn } from "@/components/biz/data-table"
export type OrderItem = {
  id: string;
  ordered?: number;
  quantity: number;
  productName: string;
  sku: string;
  barcode: string;
}
export const columns: TColumn<OrderItem, unknown>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <Link target="_blank" href={`https://plamod.com/retailer/search?q=${row.original.barcode}`} className="underline underline-offset-4">
          {row.original.productName}
        </Link>
      )
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
      const barcode = row.original.barcode
      const url = `https://admin.shopify.com/store/aot-supply/products?query=${barcode}`
      return <Link target="_blank" href={url} className="underline underline-offset-4">
        {barcode}
      </Link>
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
]