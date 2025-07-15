import * as React from "react"
import {
  Activity,
  AlarmClock,
  Binary,
  Calculator,
  ChartSpline,
  ChevronsLeftRightEllipsis,
  Command,
  GitCompareArrows,
  LifeBuoy,
  MonitorX,
  Search,
  Send,
  ToggleLeft,
  Waypoints,
  Bolt,
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
            icon: Calculator,
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
            icon: Activity,
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
            icon: ChevronsLeftRightEllipsis,
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
            icon: MonitorX,
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
            icon: GitCompareArrows,
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
            icon: Binary,
            items: [
                {
                    title: ".AND.",
                    url: "#"
                },
                {
                    title: ".OR.",
                    url: "#"
                },
                {
                    title: ".XOR.",
                    url: "#"
                },
                {
                    title: ".NOT.",
                    url: "#"
                }, {
                    title: ".NAND.",
                    url: "#"
                }, {
                    title: ".NOR.",
                    url: "#"
                }, {
                    title: ".NXOR.",
                    url: "#"
                }, {
                    title: "FFLOP1",
                    url: "#"
                },
            ]
        },{
            title: "Seletores",
            url: "#",
            icon: ToggleLeft,
            items: [{
                    title: "MAX",
                    url: "#"
                },{
                    title: "MIN",
                    url: "#"
                },{
                    title: "SELET2",
                    url: "#"
                },]
          },
          {
            title: "Atraso",
            url: "#",
            icon: AlarmClock,
            items: [{
                    title: "DELAY",
                    url: "#"
                },{
                    title: "ATRASO",
                    url: "#"
                },]
          },{
            title: "Amostragem e Temporização",
            url: "#",
            icon: Search,
            items: [{
                    title: "T/HOLD",
                    url: "#"
                },{
                    title: "S/HOLD",
                    url: "#"
                },{
                    title: "ACUM",
                    url: "#"
                },{
                    title: "DISMAX",
                    url: "#"
                },{
                    title: "DISMIN",
                    url: "#"
                },{
                    title: "DLAYON",
                    url: "#"
                },{
                    title: "DLAYOF",
                    url: "#"
                },{
                    title: "MONEST",
                    url: "#"
                },]
          },{
            title: "Funções Matemáticas",
            url: "#",
            icon: ChartSpline,
            items: [{
                    title: "DEGREE",
                    url: "#"
                },{
                    title: "RADIAN",
                    url: "#"
                },{
                    title: "SIN",
                    url: "#"
                },{
                    title: "COS",
                    url: "#"
                },{
                    title: "TAN",
                    url: "#"
                },{
                    title: "ACOS",
                    url: "#"
                },{
                    title: "ASIN",
                    url: "#"
                },{
                    title: "ATAN",
                    url: "#"
                },{
                    title: "ATAN2",
                    url: "#"
                },{
                    title: "SQRT",
                    url: "#"
                },{
                    title: "X**2",
                    url: "#"
                },{
                    title: "X**K",
                    url: "#"
                },{
                    title: "EXP",
                    url: "#"
                },{
                    title: "LOG",
                    url: "#"
                },{
                    title: "LOG10",
                    url: "#"
                },{
                    title: "INVRS",
                    url: "#"
                },{
                    title: "OFFSET",
                    url: "#"
                },{
                    title: "MENOS",
                    url: "#"
                },{
                    title: "ABS",
                    url: "#"
                },{
                    title: "SINAL",
                    url: "#"
                },{
                    title: "TRUNC",
                    url: "#"
                },{
                    title: "ROUND",
                    url: "#"
                },{
                    title: "PULSO",
                    url: "#"
                },{
                    title: "RAMPA",
                    url: "#"
                },{
                    title: "RETA",
                    url: "#"
                },{
                    title: "DEADB1",
                    url: "#"
                },{
                    title: "DEADB2",
                    url: "#"
                },{
                    title: "HISTE1",
                    url: "#"
                },{
                    title: "SAT01",
                    url: "#"
                },{
                    title: "PONTOS",
                    url: "#"
                },{
                    title: "STEPS",
                    url: "#"
                },]
          },{
            title: "Não-lineares",
            url: "#",
            icon: Waypoints,
            items: [{
                    title: "FEX",
                    url: "#"
                },{
                    title: "SUBIDA",
                    url: "#"
                },{
                    title: "DESCID",
                    url: "#"
                },{
                    title: "NOISE",
                    url: "#"
                },]
          }
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
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', 'placeholder');
    event.dataTransfer.effectAllowed = 'move';
  };

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
                  <Bolt className="size-4" />
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
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
