import { NavFooter } from '@/components/nav-footer';
import { NavGroup } from '@/components/nav-group';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavGroup as NavGroupType, type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    FileText,
    Folder,
    FolderKanban,
    Gauge,
    LayoutGrid,
    LineChart,
    Package,
    Upload,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Escenarios',
        href: '/scenarios',
        icon: FolderKanban,
    },
];

const masterDataGroup: NavGroupType = {
    title: 'Datos Maestros',
    items: [
        {
            title: 'Clientes',
            href: '/customers',
            icon: Users,
        },
        {
            title: 'Tipos de Cliente',
            href: '/customer-types',
            icon: Gauge,
        },
        {
            title: 'Grupos Empresariales',
            href: '/business-groups',
            icon: Building2,
        },
        {
            title: 'Productos',
            href: '/products',
            icon: Package,
        },
    ],
};

const importGroup: NavGroupType = {
    title: 'Datos Históricos',
    items: [
        {
            title: 'Facturas',
            href: '/invoices',
            icon: FileText,
        },
        {
            title: 'Importar Facturas',
            href: '/import/invoices',
            icon: Upload,
        },
        {
            title: 'Historial de Importación',
            href: '/import/history',
            icon: Folder,
        },
    ],
};

const configurationGroup: NavGroupType = {
    title: 'Configuración',
    items: [
        {
            title: 'Tasas de Inflación',
            href: '/settings/inflation-rates',
            icon: LineChart,
        },
    ],
};

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavGroup groups={[masterDataGroup]} />
                <NavGroup groups={[importGroup]} />
                <NavGroup groups={[configurationGroup]} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
