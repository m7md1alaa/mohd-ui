"use client";

import {
  BoxIcon,
  ChevronDownIcon,
  FileTextIcon,
  HomeIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SquareIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MainContent,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// This block is a worked example, not a reusable API: swap the nav data,
// the account menu, and the theme toggle for whatever your app actually has.
// Everything it depends on (`Sidebar*` from "@/components/ui/sidebar") is
// the generic registry primitive — this file just shows one way to compose it.

interface NavLeaf {
  icon: typeof HomeIcon;
  label: string;
  to: string;
}

interface NavGroup {
  children: NavLeaf[];
  icon: typeof HomeIcon;
  label: string;
}

const NAV_ITEMS: (NavLeaf | NavGroup)[] = [
  { label: "Home", to: "/", icon: HomeIcon },
  { label: "Docs", to: "/docs", icon: FileTextIcon },
  {
    label: "Components",
    icon: BoxIcon,
    children: [
      { label: "Button", to: "/components/button", icon: SquareIcon },
      { label: "Sidebar", to: "/components/sidebar", icon: BoxIcon },
    ],
  },
  { label: "Settings", to: "/settings", icon: SettingsIcon },
];

export function AppSidebarDemo() {
  return (
    <SidebarProvider collapsibleType="icon" groupId="demo">
      <AppSidebar />
      <MainContent className="flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Page content goes here.</p>
      </MainContent>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { isCollapsed, isMobile } = useSidebar();
  const showIconMode = isCollapsed && !isMobile;
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [activePath, setActivePath] = useState("/");

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <Sidebar>
      <div className="flex h-full flex-col">
        <SidebarHeader className="flex-row items-center justify-between px-3 pt-4 pb-3">
          <span className={showIconMode ? "hidden" : "font-semibold text-sm"}>
            Acme
          </span>
          <SidebarTrigger />
        </SidebarHeader>

        <SidebarContent className="flex-1 px-2 py-1">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {NAV_ITEMS.map((item) => {
                  if ("children" in item) {
                    const isOpen = openGroups.has(item.label);
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          className="gap-3"
                          onClick={() => toggleGroup(item.label)}
                          tooltip={item.label}
                        >
                          <item.icon className="size-4" />
                          <span className="flex-1 text-start">
                            {item.label}
                          </span>
                          <ChevronDownIcon
                            className={
                              isOpen ? "size-3.5 rotate-180" : "size-3.5"
                            }
                          />
                        </SidebarMenuButton>
                        {isOpen && (
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.to}>
                                <SidebarMenuSubButton
                                  isActive={activePath === child.to}
                                  onClick={() => setActivePath(child.to)}
                                >
                                  <child.icon className="size-3.5" />
                                  <span>{child.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        className="gap-3"
                        isActive={activePath === item.to}
                        onClick={() => setActivePath(item.to)}
                        tooltip={item.label}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-1 px-2 pt-2 pb-4">
          <ThemeToggle showIconMode={showIconMode} />
          <AccountMenu showIconMode={showIconMode} />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

function ThemeToggle({ showIconMode }: { showIconMode: boolean }) {
  const [isDark, setIsDark] = useState(false);

  return (
    <Button
      className={showIconMode ? "mx-auto size-8" : "w-full justify-start gap-3"}
      onClick={() => {
        setIsDark((v) => !v);
        document.documentElement.classList.toggle("dark");
      }}
      size={showIconMode ? "icon" : "default"}
      variant="ghost"
    >
      {isDark ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
      {!showIconMode && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </Button>
  );
}

function AccountMenu({ showIconMode }: { showIconMode: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className={
              showIconMode ? "mx-auto size-8" : "w-full justify-start gap-3"
            }
            size={showIconMode ? "icon" : "default"}
            variant="ghost"
          />
        }
      >
        <UserIcon className="size-4" />
        {!showIconMode && <span>Jane Doe</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SettingsIcon className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
