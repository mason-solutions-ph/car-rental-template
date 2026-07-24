"use client";

import Link from "next/link";
import { ExternalLinkIcon, LogOutIcon, MoreVerticalIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getInitials } from "@/lib/utils";

export function NavUser({
  user,
  canSignOut,
}: {
  user: {
    name: string;
    email: string | null;
  };
  canSignOut: boolean;
}) {
  const { isMobile } = useSidebar();
  const initials = getInitials(user.name).slice(0, 2);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {user.email ? (
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                ) : null}
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {user.email ? (
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                ) : null}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <ExternalLinkIcon />
                View site
              </Link>
            </DropdownMenuItem>
            {canSignOut ? (
              <>
                <DropdownMenuSeparator />
                <form action="/auth/signout" method="post">
                  <DropdownMenuItem asChild variant="destructive">
                    <button type="submit" className="w-full">
                      <LogOutIcon />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
