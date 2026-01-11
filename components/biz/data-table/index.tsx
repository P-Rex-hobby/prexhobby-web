"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnSort,
  ExpandedState,
  SortingState,
  TableMeta,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar, FilterItem } from "./data-table-toolbar";
import { QueryFunction, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { CustomAlterDialog } from "../custom-alert";

import { useToast } from "@/components/ui/use-toast";
import { forwardRef, useImperativeHandle } from "react";

export interface TableRef {
  refresh: () => void;
  rowSelection: () => Record<string, boolean>;
  clearSelection: () => void;
}
export type TColumn<TData, TValue> = {} & ColumnDef<TData, TValue>;
interface DataTableProps<TData, TValue> {
  queryKey?: string;
  columns: TColumn<TData, TValue>[];
  data?: TData[];
  actions?: Record<string, (params?: any) => Promise<any>>;
  filters?: FilterItem[];
  selection?: {
    enabled?: boolean;
    buttons?: {
      key: string;
      title: string | React.ReactNode;
    }[][];
  };
  getRowId?: (row: TData) => string;
  viewOptions?: boolean;
  pagination?: boolean;
  toolbar?: boolean | React.ReactNode;
  meta?: TableMeta<TData>;
  onLoadingChange?: (isLoading: boolean) => void;
  onSearchParamsChange?: (params: Record<string, any>) => void;
  onSelectionClear?: () => void;
}
function useStableData(data: any) {
  const [stableData, setStableData] = React.useState(data);
  const dataRef = React.useRef(data);

  React.useEffect(() => {
    // Only update if the new data is not undefined and different from the last known data
    if (data !== undefined && data !== dataRef.current) {
      setStableData(data);
      dataRef.current = data;
    }
  }, [data]);

  return stableData;
}

const defaultPageSize = 10;

const DataTable = <TData extends { id: string }, TValue>(
  {
    queryKey,
    columns,
    data,
    actions,
    filters,
    selection,
    viewOptions,
    pagination = true,
    toolbar = true,
    meta,
    getRowId,
    onLoadingChange,
    onSearchParamsChange,
    onSelectionClear,
  }: DataTableProps<TData, TValue>,
  ref: React.Ref<TableRef> | null
) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const [alterOpen, setAlterOpen] = React.useState(false);
  const [alterData, setAlterData] = React.useState<{
    key: string;
    title: string;
    description?: string;
  }>({
    key: "delete",
    title: "",
  });
  const defaultVariables = React.useMemo(() => {
    const vars: Record<string, any> = {};
    const keys = Array.from(searchParams.keys());
    keys.forEach((k) => {
      vars[k] = searchParams.get(k);
    });
    return {
      ...vars,
    };
  }, []);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [variables, setVariables] = React.useState(defaultVariables);

  const {
    data: queryData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [queryKey, variables],
    queryFn: () => actions?.fetch(variables),
    enabled: !!actions?.fetch && !!queryKey,
    staleTime: 0,
  });
  React.useEffect(() => {
    if (!isLoading) {
      const list = queryData?.[queryKey!] || [];
      if (list.length === 0 && variables.page > 1) {
        const total = queryData?.total[0].count || 0;
        //go to the last page
        const page = Math.ceil(total / (variables.size || defaultPageSize));
        navigate({ page });
      }
    }
    onLoadingChange?.(isLoading);
  }, [isLoading]);

  const pageIndex = React.useMemo(() => {
    if (variables.page) {
      return parseInt(variables.page) - 1;
    }
    return 0;
  }, [variables.page]);

  const pageSize = React.useMemo(() => {
    if (variables.size) {
      return parseInt(variables.size);
    }
    return defaultPageSize;
  }, [variables.size]);

  const stableQueryData = useStableData(queryData);

  const tableData = data || stableQueryData?.[queryKey!] || [];

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      expanded,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    rowCount: stableQueryData?.total?.[0].count,
    getRowId: (row) => {
      if (getRowId) {
        return getRowId(row);
      }
      return row.id;
    },
    onExpandedChange: setExpanded,
    getSubRows: (row: any) => row.children || [],
    onRowSelectionChange: setRowSelection,
    //onSortingChange: setSorting,
    onSortingChange: (updater) => {
      setSorting(updater);
      const newSortingValue =
        updater instanceof Function ? updater(sorting) : updater;
      const sort = newSortingValue
        .map((s) => `${s.id}_${s.desc ? "desc" : "asc"}`)
        .join(",");
      navigate({ sort, page: 1 });
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),
    meta,
  });
  useImperativeHandle(ref, () => ({
    refresh: () => {
      refetch();
    },
    rowSelection: () => {
      return table.getState().rowSelection;
    },
    clearSelection: () => {
      onSelectionClear?.()
      table.setRowSelection({});
    },
  }));
  const navigate = (params: Record<string, any>) => {
    const data = {
      ...variables,
      ...params,
    };
    const search = new URLSearchParams(data).toString();
    //router.push(`${pathname}?${search}`)
    window.history.replaceState({}, "", `${pathname}?${search}`);
    setVariables(data);
    onSearchParamsChange?.(params);
  };
  const onDelete = () => {
    setAlterData({
      key: "delete",
      title: "Delete",
      description: "Are you sure you want to delete the selected rows?",
    });
    setAlterOpen(true);
  };
  const handleAlterConfirm = () => {
    const { key } = alterData;
    switch (key) {
      case "delete":
        handleDelete();
        break;
    }
  };
  const handleDelete = () => {
    const rowSelection = table.getState().rowSelection;
    const rowIds = Object.keys(rowSelection);
    if (actions?.delete) {
      setLoading({ delete: true });
      actions
        .delete(rowIds)
        .then(() => {
          table.setRowSelection({});
          refetch();
        })
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
          });
        })
        .finally(() => {
          setAlterOpen(false);
          setLoading({ delete: false });
        });
    }
  };
  const tableHeader = React.useMemo(() => {
    const rowSelection = table.getState().rowSelection;
    const rowIds = Object.keys(rowSelection);
    if (rowIds.length > 0) {
      return table.getHeaderGroups().map((headerGroup) => {
        const headers = headerGroup.headers;
        if (headers.length === 0) {
          return null;
        }
        const header = headers[0];
        return (
          <TableRow key={headerGroup.id}>
            <TableHead key={header.id} colSpan={header.colSpan}>
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </TableHead>
            <TableHead key="selected" colSpan={table.getAllColumns().length}>
              <div className="flex items-center justify-between">
                <div>{rowIds.length} row(s) selected.</div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="link"
                    className="px-0"
                    onClick={() => {
                      onSelectionClear?.();
                      table.setRowSelection({});
                    }}
                  >
                    Clear selection
                  </Button>
                  <Button
                    variant="link"
                    className="text-red-500 px-0"
                    onClick={() => onDelete()}
                  >
                    Delete
                  </Button>
                  {selection?.buttons?.length && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                        >
                          <DotsHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        {selection.buttons.map((buttons, index) => {
                          return (
                            <>
                              {index > 0 && (
                                <DropdownMenuSeparator key={`sep-${index}`} />
                              )}

                              {buttons.map((button) => {
                                return (
                                  <DropdownMenuItem key={button.key}>
                                    {button.title}
                                  </DropdownMenuItem>
                                );
                              })}
                            </>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </TableHead>
          </TableRow>
        );
      });
    }
    return table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => {
          return (
            <TableHead key={header.id} colSpan={header.colSpan}>
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </TableHead>
          );
        })}
      </TableRow>
    ));
  }, [table.getHeaderGroups(), table.getFilteredSelectedRowModel().rows]);
  const renderToolbar = () => {
    if (toolbar === false) {
      return null;
    }
    if (toolbar === true) {
      return (
        <DataTableToolbar
          table={table}
          viewOptions={viewOptions}
          filters={filters}
        />
      );
    }
    return toolbar;
  };
  return (
    <>
      <div className="space-y-4">
        {renderToolbar()}
        <div className="rounded-md border">
          <Table>
            <TableHeader>{tableHeader}</TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: any) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <TableCell
                        width={(cell.column.columnDef.meta as any)?.width}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <DataTablePagination
            table={table}
            onPageSizeChange={(size) => {
              navigate({ size, page: 1 });
            }}
            onPageChange={(page) => {
              navigate({ page });
            }}
          />
        )}
      </div>
      <CustomAlterDialog
        open={alterOpen}
        title={alterData.title}
        description={alterData.description}
        onCancel={() => {
          setAlterOpen(false);
        }}
        onConfirm={() => {
          handleAlterConfirm();
        }}
        confirmLoading={loading[alterData.key]}
      />
    </>
  );
};
DataTable.displayName = "DataTable";
export default forwardRef(DataTable) as <TData extends { id: string }, TValue>(
  props: DataTableProps<TData, TValue> & { ref?: React.Ref<TableRef> }
) => React.ReactElement;
