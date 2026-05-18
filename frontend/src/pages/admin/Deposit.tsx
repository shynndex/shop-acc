import { useAdminDepositStore } from "@/stores/useAdminDepositStore";
import React, { useEffect, useState } from "react";

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const typeOptions = [
  { value: "", label: "Tất cả loại" },
  { value: "bank", label: "Chuyển khoản" },
  { value: "card", label: "Thẻ cào" },
];

const Deposit = () => {
  const { deposits, pagination, loading, fetchList, updateStatus, exportCsv } =
    useAdminDepositStore();

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    page: 1,
    limit: 15,
  });

  useEffect(() => {
    fetchList(filters);
  }, [filters, fetchList]);

  const handleExport = async () => {
    const blob = await exportCsv(filters);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deposits-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return <div>Deposit</div>;
};

export default Deposit;
