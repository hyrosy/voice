import { useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

export function useNavigationTree({
  data,
  allSections = [],
  theme = {},
  isPreview = false,
}: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ slug?: string; username?: string }>();

  const customPages = theme.customPages || data.customPages || [];
  const publicSlug = theme.publicSlug || data.publicSlug || "";
  const username = params.slug || params.username || publicSlug || "portfolio";
  const pathPrefix = location.pathname.startsWith("/pro") ? "/pro" : "";

  const menuTree = useMemo(() => {
    const flatItems: Array<any> = [];
    const config = data.menuConfig || {};
    const isMegaMenu = data.menuType === "mega";

    // 1. Shop Page
    if (!config.page_shop || config.page_shop.visible !== false) {
      flatItems.push({
        label: config.page_shop?.label || "Shop",
        id: "system_shop",
        type: "page",
        url: `${pathPrefix}/${username}/shop`,
        folderId: config.page_shop?.folderId,
      });
    }

    // 2. Custom Pages
    customPages
      .filter((p: any) => !p.isHome)
      .forEach((p: any) => {
        const pageConfig = config[`page_${p.id}`];
        if (!pageConfig || pageConfig.visible !== false) {
          flatItems.push({
            label: pageConfig?.label || p.title,
            id: p.id,
            type: "page",
            url: `${pathPrefix}/${username}/${p.slug}`,
            folderId: pageConfig?.folderId,
          });
        }
      });

    // 3. Custom Links
    const customNavLinks = data.customNavLinks || [];
    customNavLinks.forEach((link: any) => {
      if (link.label && link.url && link.visible !== false) {
        flatItems.push({ ...link, type: "custom_link" });
      }
    });

    // 4. On-Page Sections
    allSections
      .filter((s: any) => s.isVisible && s.type !== "header")
      .forEach((s: any) => {
        const secConfig = config[s.id];
        if (data.autoMenu !== false) {
          if (s.data.title)
            flatItems.push({
              label: s.data.title || s.type,
              id: s.id,
              type: "section",
              folderId: secConfig?.folderId,
            });
        } else {
          if (!secConfig || secConfig.visible !== false) {
            flatItems.push({
              label: secConfig?.label || s.data.title || s.type,
              id: s.id,
              type: "section",
              folderId: secConfig?.folderId,
            });
          }
        }
      });

    // 5. Mega Menu Stitching
    if (isMegaMenu) {
      const folders = data.megaMenuFolders || [];
      const tree: Array<any> = [];
      const folderMap: Record<string, any> = {};

      folders.forEach((f: any) => {
        folderMap[f.id] = {
          label: f.label,
          id: f.id,
          type: "folder",
          children: [],
        };
      });

      flatItems.forEach((item) => {
        if (item.folderId && folderMap[item.folderId]) {
          folderMap[item.folderId].children.push(item);
        } else {
          tree.push(item);
        }
      });

      folders.forEach((f: any) => {
        if (folderMap[f.id].children.length > 0) tree.push(folderMap[f.id]);
      });

      return tree;
    }

    return flatItems;
  }, [data, allSections, customPages, username, pathPrefix]);

  // Click Handler logic extracted so developers don't need react-router!
  const handleNavClick = (item: any) => {
    if (isPreview) return;

    if (item.type === "page" && item.url) {
      navigate(item.url);
    } else if (item.type === "custom_link" && item.url) {
      if (item.url.startsWith("http")) window.open(item.url, "_blank");
      else if (item.url.startsWith("/"))
        navigate(`${pathPrefix}/${username}${item.url}`);
      else navigate(`${pathPrefix}/${username}/${item.url}`);
    } else if (item.type === "section") {
      const scrollNav = () => {
        const element = document.getElementById(item.id);
        if (element) {
          const y =
            element.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      };

      if (location.pathname !== `${pathPrefix}/${username}`) {
        navigate(`${pathPrefix}/${username}`);
        setTimeout(scrollNav, 300);
      } else {
        scrollNav();
      }
    }
  };

  return { menuTree, handleNavClick };
}
