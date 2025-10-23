import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * This component automatically scrolls the window to the top (0, 0)
 * every time the user navigates to a new page.
 */
const ScrollToTop = () => {
  // Get the current page's "pathname" (e.g., "/actor/chaimae")
  const { pathname } = useLocation();

  // This effect will run every time the pathname changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // This component renders nothing, it just performs an action
  return null;
};

export default ScrollToTop;
