import { Outlet } from "react-router-dom";
import { PageHeader } from "@/components/admin/shared";

const ConfigLayout = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quản lý cấu hình chung, ngân hàng, thẻ cào và giao diện"
      />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default ConfigLayout;
