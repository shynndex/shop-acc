import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatVND } from "@/lib/utils";
import type { Account } from "@/types/admin/account";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";

// Game icon mapping
const gameIcons: Record<string, string> = {
  "lien-quan": "🎮",
  "lien-minh": "🕹️",
  valorant: "🔫",
  "free-fire": "🔥",
  khac: "🎲",
};

// Format game name for display
const formatGame = (game: string) => {
  const names: Record<string, string> = {
    "lien-quan": "Liên Quân",
    "lien-minh": "LMHT",
    valorant: "Valorant",
    "free-fire": "Free Fire",
    khac: "Khác",
  };
  return names[game] || game;
};

//  Badge variant theo loại tài khoản
const getTypeVariant = (type: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    vip: "default",
    standard: "secondary",
    reg: "outline",
    random: "destructive",
  };
  return variants[type] || "secondary";
};

// Status badge component
const getStatusBadge = (isActive?: boolean) => {
  if (isActive !== false) {
    return (
      <Badge variant="success" className="bg-green-500 hover:bg-green-600">
        Hiển thị
      </Badge>
    );
  }
  return <Badge variant="secondary">Ẩn</Badge>;
};

export const AccountColumns: ColumnDef<Account>[] = [
  // Column 1: Title
  {
    accessorKey: "title",
    header: "Tên tài khoản",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <span className="font-medium truncate max-w-[200px]" title={title}>
          {title}
        </span>
      );
    },
  },

  // Column 2: Game
  {
    accessorKey: "game",
    header: "Game",
    cell: ({ row }) => {
      const game = row.getValue("game") as string;
      return (
        <Badge variant="outline" className="gap-1 capitalize">
          <span>{gameIcons[game] || "🎮"}</span>
          <span>{formatGame(game)}</span>
        </Badge>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },

  // Column 3: Type
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant={getTypeVariant(type)}>{type}</Badge>;
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },

  // Column 4: Price
  {
    accessorKey: "price",
    header: "Giá",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return (
        <span className="text-green-600 font-semibold">
          {formatVND(price)}đ
        </span>
      );
    },
  },

  // Column 5: Status (isActive)
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean | undefined;
      return getStatusBadge(isActive);
    },
    filterFn: (row, id, value) => {
      if (value.length === 0) return true;
      const isActive = row.getValue(id) as boolean | undefined;
      return value.includes(isActive !== false ? "active" : "inactive");
    },
  },

  // Column 6: Created At
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string);
      return (
        <span className="text-muted-foreground text-sm">
          {date.toLocaleDateString("vi-VN")}
        </span>
      );
    },
  },

  // Column 7: Actions (Dropdown menu)
  {
    id: "actions",
    header: () => <span className="sr-only">Thao tác</span>,
    cell: ({ row }) => {
      const account = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Mở menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => console.log("Edit", account._id)}>
              <Edit className="mr-2 size-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                console.log("Toggle", account._id, !account.isActive)
              }
              className={
                account.isActive ? "text-orange-600" : "text-green-600"
              }
            >
              {account.isActive ? (
                <ToggleLeft className="mr-2 size-4" />
              ) : (
                <ToggleRight className="mr-2 size-4" />
              )}
              {account.isActive ? "Ẩn" : "Hiển thị"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log("Delete", account._id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
