import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  LifeBuoy,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Saulo Silva",
    email: "saulo.silva@ons.org.br",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Aritméticos",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "SOMA",
                    url: "#"
                },
                {
                    title: "MULTPL",
                    url: "#"
                },
                {
                    title: "DIVSAO",
                    url: "#"
                },
                {
                    title: "GANHO",
                    url: "#"
                }, {
                    title: "FRACAO",
                    url: "#"
                },
            ]
        },
        {
            title: "Dinâmicos e Limitadores",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "ORD(1)",
                    url: "#"
                },
                {
                    title: "LEDLAG",
                    url: "#"
                },
                {
                    title: "POLS",
                    url: "#"
                },
                {
                    title: "PROINT",
                    url: "#"
                }, {
                    title: "WSHOUT",
                    url: "#"
                }, {
                    title: "DERIVA",
                    url: "#"
                }, {
                    title: "LIMITA",
                    url: "#"
                }, {
                    title: "RATELM",
                    url: "#"
                }, {
                    title: "LAGNL",
                    url: "#"
                }, {
                    title: "INTRES",
                    url: "#"
                }, {
                    title: "LDLAG2",
                    url: "#"
                }, {
                    title: "PROIN2",
                    url: "#"
                }, {
                    title: "WSHOU2",
                    url: "#"
                },


            ]
        },
        {
            title: "Inteface",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "EXPORT",
                    url: "#"
                }, {
                    title: "IMPORT",
                    url: "#"
                },
            ]
        },
        {
            title: "Terminadores",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "ENTRAD",
                    url: "#"
                }, {
                    title: "SAIDA",
                    url: "#"
                }, {
                    title: "ALERTA",
                    url: "#"
                }, {
                    title: "FIMPRG",
                    url: "#"
                },

            ]
        }, {
            title: "Comparadores",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: ".LT.",
                    url: "#"
                },
                {
                    title: ".LE.",
                    url: "#"
                },
                {
                    title: ".GT.",
                    url: "#"
                },
                {
                    title: ".GE.",
                    url: "#"
                }, {
                    title: ".EQ.",
                    url: "#"
                }, {
                    title: ".NE.",
                    url: "#"
                },
            ]
        }, {
            title: "Lógicos",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "AND",
                    url: "#"
                },
                {
                    title: "OR",
                    url: "#"
                },
                {
                    title: "XOR",
                    url: "#"
                },
                {
                    title: "NOT",
                    url: "#"
                }, {
                    title: "NAND",
                    url: "#"
                }, {
                    title: "NOR",
                    url: "#"
                }, {
                    title: "NXOR",
                    url: "#"
                }, {
                    title: "FFLOP1",
                    url: "#"
                },
            ]
        },
    ],
    navSecondary: [
        {
            title: "Suporte",
            url: "#",
            icon: LifeBuoy
        }, {
            title: "Feedback",
            url: "#",
            icon: Send
        },
    ],
    projects: [ ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-[--header-height] !h-[calc(100svh-var(--header-height))]"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">WebCDU</span>
                  <span className="truncate text-xs">Versão 0.1.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
