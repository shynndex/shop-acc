"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { pathname } = useLocation();

  const isRouteActive = (url: string) =>
    url === "/admin"
      ? pathname === url
      : pathname === url || pathname.startsWith(url + "/");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>

      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const hasChildren = !!item.items?.length;

          const isChildActive = hasChildren
            ? item.items!.some((sub) => isRouteActive(sub.url))
            : false;

          const isActive = !hasChildren && isRouteActive(item.url);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isChildActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {hasChildren ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isChildActive}
                      >
                        {item.icon && <item.icon />}

                        <span>{item.title}</span>

                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 duration-200">
                      <SidebarMenuSub className="space-y-1 pt-1">
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                              asChild
                              isActive={isRouteActive(subItem.url)}
                            >
                              <Link to={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}

                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}