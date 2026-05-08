import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Plus, UserRoundX } from "lucide-react";

interface EmptyStateProps {
  onCreate: () => void;
}

const EmptyState = ({ onCreate }: EmptyStateProps) => {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserRoundX />
        </EmptyMedia>
        <EmptyTitle>Chưa có tài khoản nào</EmptyTitle>
        <EmptyDescription>
          Hãy thêm tài khoản để bắt đầu bán hàng
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm tài khoản
        </Button>
      </EmptyContent>
    </Empty>
  );
};

export default EmptyState;
