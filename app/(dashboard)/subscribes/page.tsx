"use client";
import DataTable, { TableRef } from "@/components/biz/data-table";
import { SubscribeItem, columns } from "./components/columns";
import { subscribes } from "@/apis/subscribe";
import Page from "@/components/biz/page";
import CustomCard from "@/components/biz/custom-card";
import { Suspense, useRef, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubscribeTableWrapper() {
  const tableRef = useRef<TableRef>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [barcode, setBarcode] = useState("");
  const [tableLoading, setTableLoading] = useState(false);

  // 初始化默认分页参数
  useEffect(() => {
    const currentSize = searchParams.get("size");
    if (!currentSize) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("size", "50");
      router.replace(`${pathname}?${newSearchParams.toString()}`);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setBarcode(searchParams.get("barcode") || "");
  }, [searchParams]);

  const replaceSearchParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 w-[220px]"
        placeholder="Barcode"
        value={barcode}
        disabled={tableLoading}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const nextBarcode = barcode.trim();
            replaceSearchParams({
              barcode: nextBarcode || undefined,
              page: "1",
            });
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        loading={tableLoading}
        onClick={() => {
          const nextBarcode = barcode.trim();
          replaceSearchParams({
            barcode: nextBarcode || undefined,
            page: "1",
          });
        }}
      >
        Search
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={tableLoading}
        onClick={() => {
          setBarcode("");
          replaceSearchParams({
            barcode: undefined,
            page: "1",
          });
        }}
      >
        Clear
      </Button>
      {tableLoading && (
        <span className="text-xs text-muted-foreground">Loading data...</span>
      )}
    </div>
  );

  const actions = {
    fetch: async (params: any) => {
      // 确保传递正确的分页参数
      const requestParams = {
        ...params,
        // 如果没有指定size，使用API默认的50
        size: params.size || 50,
        // 如果没有指定page，使用1
        page: params.page || 1,
      };
      
      const response = await subscribes(requestParams);
      const data = response?.data ?? response;
      
      // 处理数据格式，将原始数据转换为DataTable期望的格式
      const processedData = (data?.content || []).map((item: any) => ({
        id: item.product.id,
        product: item.product,
        count: item.count,
      }));

      return {
        subscribes: processedData,
        total: [{ count: data?.totalElements || 0 }],
        // 返回实际的分页信息
        pagination: {
          current: data?.current || 1,
          size: data?.size || 50,
          totalPages: data?.totalPages || 0,
        },
      };
    },
  };

  return (
    <DataTable<SubscribeItem, unknown>
      key={`${pathname}?${searchParams.toString()}`}
      ref={tableRef}
      queryKey="subscribes"
      columns={columns}
      pagination={true}
      toolbar={toolbar}
      actions={actions}
      onLoadingChange={setTableLoading}
    />
  );
}

export default function Subscribes() {
  return (
    <Page
      title="Subscribes"
      className="max-w-full"
    >
      <CustomCard>
        <Suspense fallback={<div>Loading...</div>}>
          <SubscribeTableWrapper />
        </Suspense>
      </CustomCard>
    </Page>
  );
} 
