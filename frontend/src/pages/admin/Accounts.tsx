import EmptyState from "@/components/admin/accounts/EmptyState";
import ErrorMessage from "@/components/admin/accounts/ErrorMessage";
import { Button } from "@/components/ui/button";
import { useAdminAccountStore } from "@/stores/useAdminAccountStore";
import type { Account } from "@/types/admin/account";
import { Plus, RefreshCw } from "lucide-react";
import  { useState } from "react";

const Accounts = () => {
    const {accounts,pagination,loading,error,fetchList} = useAdminAccountStore()
    const [showForm,setShowForm] = useState(false)
    const [editingAccount,setEditingAccount] = useState<Account | null>(null)
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
          <AccountSearch />
          <AccountFilters />
        </div>

        {
          loading ? (
            <TableSkeleton />
          ): error ? (
            <ErrorMessage message={error} onRetry={()=>{fetchList({page:1})}}/>
          ) : Accounts.length === 0 ? (
            <EmptyState onCreate={() => {}} />

          ) : (
            <AccountTable accounts={accounts} onEdit={(id)=>{
              const acc = accounts.find((a) => a._id === id);
              if(acc){
                setEditingAccount(acc); setShowForm(true)
                
              }
            }}/>
          )
        }
        
        {showForm &&(
          <AccountForm initialData = {editingAccount}
          onClose={() => setShowForm(false);set EditingAccount(null)}
          onSuccess={() => fetchList({ page: 1 })}
          />
        )}
      </div>
    </div>
  );
};

export default Accounts;
