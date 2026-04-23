import { Text } from "./components/Text";
import { useScrollObserver } from "./hooks/useScrollObserver";
import { useCart } from "./hooks/useCart";
import { useNavigationTree } from "./hooks/useNavigationTree";
import { useDeviceSize } from "./hooks/useDeviceSize";
import { utils } from "./utils";
import { useGallery } from "./hooks/useGallery"; // 🚀 1. Import it here
import { useCarousel } from "./hooks/useCarousel"; // 🚀 Add this

export const UCP = {
  Text,
  useScrollObserver,
  useCart,
  useNavigationTree,
  useDeviceSize, // 🚀 New!
  useGallery, // 🚀 2. Add it to the SDK object
  useCarousel, // 🚀 Export it here
  utils, // 🚀 New!

};
