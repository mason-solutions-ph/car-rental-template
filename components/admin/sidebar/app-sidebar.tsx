"use client";

import Link from "next/link";
import { CommandIcon } from "lucide-react";

import { NavMain } from "@/components/admin/sidebar/nav-main";
import { NavUser } from "@/components/admin/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SITE_NAME } from "@/lib/constants";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

export function AppSidebar({
  user,
  badges,
  canSignOut,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string | null };
  badges?: { unpaidPending?: number };
  canSignOut: boolean;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={SITE_NAME}>
              <Link href="/admin">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CommandIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{SITE_NAME}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Admin
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} badges={badges} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} canSignOut={canSignOut} />
      </SidebarFooter>
    </Sidebar>
  );
}
