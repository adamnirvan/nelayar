import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, CloudRain, CircleDollarSign } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function AppSidebar() {
    // Kita gunakan /map sebagai beranda utama setelah login
    const dashboardUrl = '/map';

    // 1. MENU UTAMA (Menyesuaikan dengan routes/web.php yang baru kita buat)
    const mainNavItems: NavItem[] = [
        {
            title: 'Peta Nelayar',
            href: '/map',
            icon: LayoutGrid,
        },
        {
            title: 'Cuaca Maritim',
            href: '/weather',
            icon: CloudRain,
        },
        {
            title: 'Harga Ikan',
            href: '/prices',
            icon: CircleDollarSign,
        },
    ];

    // 2. MENU FOOTER (Ubah dari bawaan Laravel jadi milik timmu sendiri)
    const footerNavItems: NavItem[] = [
        {
            title: 'Repository Tim',
            href: 'https://github.com/brianabdl/nelayar-gis', // Link ke repo kalian
            icon: FolderGit2,
        },
        {
            title: 'Dokumentasi',
            href: '#',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}