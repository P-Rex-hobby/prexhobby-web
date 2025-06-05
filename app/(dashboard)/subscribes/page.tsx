"use client";
import DataTable, { TableRef } from "@/components/biz/data-table";
import { SubscribeItem, columns } from "./components/columns";
import { subscribes } from "@/apis/subscribe";
import Page from "@/components/biz/page";
import CustomCard from "@/components/biz/custom-card";
import { Suspense, useRef, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function SubscribeTableWrapper() {
  const tableRef = useRef<TableRef>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 初始化默认分页参数
  useEffect(() => {
    const currentSize = searchParams.get('size');
    if (!currentSize) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('size', '50');
      router.replace(`${pathname}?${newSearchParams.toString()}`);
    }
  }, []);

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
      
      // 处理数据格式，将原始数据转换为DataTable期望的格式
      const processedData = (response?.data?.content || []).map((item: any) => ({
        id: item.product.id,
        product: item.product,
        count: item.count,
      }));

      return {
        subscribes: processedData,
        total: [{ count: response?.data?.totalElements || 0 }],
        // 返回实际的分页信息
        pagination: {
          current: response?.data?.current || 1,
          size: response?.data?.size || 50,
          totalPages: response?.data?.totalPages || 0,
        },
      };
    },
  };

  return (
    <DataTable<SubscribeItem, unknown>
      ref={tableRef}
      queryKey="subscribes"
      columns={columns}
      pagination={true}
      actions={actions}
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