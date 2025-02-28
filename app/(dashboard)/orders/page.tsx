"use client";
import DataTable, { TableRef } from "@/components/biz/data-table";
import { OrderItem, columns } from "./components/columns";
import { orders, addToCart } from "@/apis/order";
import Page from "@/components/biz/page";
import CustomCard from "@/components/biz/custom-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { addDays, format, set } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Suspense, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { useToast } from "@/components/ui/use-toast";

export default function Orders() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const tableRef = useRef<TableRef>(null);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [variables, setVariables] = useState({});
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["orders", variables],
    queryFn: () => orders(variables),
    staleTime: 0,
  });
  const handleAddToCart = () => {
    const selection = tableRef.current?.rowSelection() || {};
    const orderIds: string[] = Object.keys(selection);
    if (!orderIds.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one order",
      });
      return;
    }
    setSubmitting(true);
    addToCart(orderIds)
      .then(() => {
        tableRef.current?.clearSelection();
        refetch();
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  const toolbar = (
    <div className="flex items-center gap-4">
      <DatePickerWithRange
        value={date}
        onChange={(value) => {
          setDate(value);
        }}
      />
      <Button
        type="button"
        loading={isLoading}
        size="sm"
        onClick={() => {
          if (!date || (!date.from && !date.to)) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Please select a date range",
            });
            return;
          }
          const to = date.to || date.from;
          const from = date.from || date.to;
          setVariables({
            ...variables,
            startDate: format(from!, "yyyy-MM-dd"),
            endDate: format(to!, "yyyy-MM-dd"),
            ts: new Date().getTime(),
          });
        }}
      >
        Filter Orders
      </Button>
      <div className="flex items-center gap-4">
        <div className="bg-green-600 w-4 h-4 rounded-full"></div>
        <span className="text-sm">购物车已有数量</span>
        <div className="bg-red-500 w-4 h-4 rounded-full"></div>
        <span className="text-sm">总共需要的数量</span>
      </div>
    </div>
  );
  return (
    <Page
      title="Orders"
      className="max-w-full"
      headerButtons={[
        <Button
          type="button"
          loading={submitting}
          key={"submit"}
          size="sm"
          onClick={() => {
            handleAddToCart();
          }}
        >
          Add to cart
        </Button>,
      ]}
    >
      <CustomCard>
        <Suspense>
          <DataTable<OrderItem, unknown>
            ref={tableRef}
            queryKey="orders"
            columns={columns}
            pagination={false}
            data={data?.orders || []}
            toolbar={toolbar}
            selection={{
              enabled: true,
            }}
          />
        </Suspense>
      </CustomCard>
    </Page>
  );
}
