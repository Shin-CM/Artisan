import * as React from "react";
import {
  ArrowLeftRight,
  Calendar,
  Database,
  Home,
  Settings,
  Store,
  UserCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconToolButton } from "@/components/IconToolButton";
import { ProfileModal } from "@/components/ProfileModal";
import { GlobalSearchField } from "@/components/GlobalSearchField";
import { AlertsBell } from "@/components/AlertsBell";

export function TopBar() {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const homeActive = loc.pathname.startsWith("/home");
  const calendarActive = loc.pathname.startsWith("/calendar");
  const dbActive = loc.pathname.startsWith("/database");
  const marketplaceActive = loc.pathname.startsWith("/marketplace");
  const settingsActive = loc.pathname.startsWith("/settings");
  const dataManagerActive = loc.pathname.startsWith("/data-manager");

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-[var(--color-border)] bg-[var(--color-card)] px-2">
        <IconToolButton
          label="Accueil"
          active={homeActive}
          onClick={() => void navigate("/home/dashboard")}
        >
          <Home className="h-5 w-5" />
        </IconToolButton>
        <IconToolButton
          label="Calendrier"
          active={calendarActive}
          onClick={() => void navigate("/calendar")}
        >
          <Calendar className="h-5 w-5" />
        </IconToolButton>
        <IconToolButton
          label="Bases de données"
          active={dbActive}
          onClick={() => void navigate("/database/clients")}
        >
          <Database className="h-5 w-5" />
        </IconToolButton>
        <IconToolButton
          label="Marketplace"
          active={marketplaceActive}
          onClick={() => void navigate("/marketplace")}
        >
          <Store className="h-5 w-5" />
        </IconToolButton>
        <div className="mx-4 flex flex-1 justify-center">
          <GlobalSearchField />
        </div>
        <IconToolButton
          label="Import et export des données"
          active={dataManagerActive}
          onClick={() => void navigate("/data-manager")}
        >
          <ArrowLeftRight className="h-5 w-5" />
        </IconToolButton>
        <AlertsBell />
        <IconToolButton
          label="Paramètres"
          active={settingsActive}
          onClick={() => void navigate("/settings/workspace")}
        >
          <Settings className="h-5 w-5" />
        </IconToolButton>
        <IconToolButton
          label="Compte et préférences"
          onClick={() => setProfileOpen(true)}
        >
          <UserCircle className="h-5 w-5" />
        </IconToolButton>
      </header>
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
