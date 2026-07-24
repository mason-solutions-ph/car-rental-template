"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, PlusCircleIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type {
  NavBadge,
  NavGroup,
  NavMainItem,
  NavMainLinkItem,
  NavMainParentItem,
} from "@/navigation/sidebar/sidebar-items";

function hasSubItems(item: NavMainItem): item is NavMainParentItem {
  return Boolean(item.subItems?.length);
}

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/admin") return pathname === "/admin";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavMain({
  items,
  badges,
}: {
  items: readonly NavGroup[];
  badges?: { unpaidPending?: number };
}) {
  const path = usePathname();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Add onsite booking"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <Link href="/admin/bookings?new=1">
                  <PlusCircleIcon />
                  <span>Add booking</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label ? (
            <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
              {group.label}
            </SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                if (hasSubItems(item)) {
                  const open = item.subItems.some((sub) =>
                    isActivePath(path, sub.url),
                  );
                  return (
                    <NavCollapsibleItem
                      key={item.id}
                      item={item}
                      isActive={open}
                      defaultOpen={open}
                      pathname={path}
                    />
                  );
                }

                const active = isActivePath(path, item.url);
                const countBadge =
                  item.id === "bookings" && badges?.unpaidPending
                    ? badges.unpaidPending
                    : item.badge;

                return (
                  <NavLinkItem
                    key={item.id}
                    item={item}
                    isActive={active}
                    badge={countBadge}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

function NavLinkItem({
  item,
  isActive,
  badge,
}: {
  item: NavMainLinkItem;
  isActive: boolean;
  badge?: NavBadge;
}) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
        <Link href={item.url} aria-disabled={item.disabled}>
          {Icon ? <Icon /> : null}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      <NavItemBadge badge={badge} />
    </SidebarMenuItem>
  );
}

function NavCollapsibleItem({
  item,
  isActive,
  defaultOpen,
  pathname,
}: {
  item: NavMainParentItem;
  isActive: boolean;
  defaultOpen: boolean;
  pathname: string;
}) {
  const Icon = item.icon;

  return (
    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            {Icon ? <Icon /> : null}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => {
              const SubIcon = subItem.icon;
              return (
                <SidebarMenuSubItem key={subItem.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isActivePath(pathname, subItem.url)}
                  >
                    <Link href={subItem.url}>
                      {SubIcon ? <SubIcon /> : null}
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavItemBadge({ badge }: { badge?: NavBadge }) {
  if (badge == null || badge === 0) return null;

  if (typeof badge === "number") {
    return (
      <SidebarMenuBadge
        className={cn(
          "border-transparent bg-attention/15 text-attention rounded-sm border font-mono tabular-nums",
        )}
      >
        {badge > 99 ? "99+" : badge}
      </SidebarMenuBadge>
    );
  }

  return (
    <SidebarMenuBadge
      className={cn(
        "rounded-sm border capitalize",
        badge === "new" &&
          "border-green-600 text-green-600 peer-hover/menu-button:text-green-600 peer-data-active/menu-button:text-green-600",
        badge === "soon" && "border-muted-foreground text-muted-foreground",
      )}
    >
      {badge}
    </SidebarMenuBadge>
  );
}
