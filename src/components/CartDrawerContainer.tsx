import React from "react";
import ModernCartDrawer from "../themes/modern/CartDrawer";
// import MinimalCartDrawer from '../themes/minimal/CartDrawer';

interface CartDrawerContainerProps {
  theme: string;
  username?: string;
}

export default function CartDrawerContainer({
  theme,
  username,
}: CartDrawerContainerProps) {
  // ROUTER: Inject the exact layout based on the theme

  // if (theme === 'minimal') {
  //   return <MinimalCartDrawer username={username} />;
  // }

  // Default fallback is ALWAYS Modern
  return <ModernCartDrawer username={username} />;
}
