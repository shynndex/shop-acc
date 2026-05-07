import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import React from "react";

const Accounts = () => {
    const loading = false
  return (
    <div className="container-wrapper">
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Quản lý tài khoản game
            </h1>
            <p className="text-muted-foreground">
              Quản lý tài khoản game ở đây.Thêm, sửa, ẩn/hiện tài khoản để bán
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant={"outline"} onClick={() => {}} disabled={loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới{" "}
            </Button>
            <Button onClick={()=>{}}>
                <Plus
                  className="mr-2 h-4 w-4"
                />
                Thêm tài khoản
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div>Search</div>
          <div>filter</div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
