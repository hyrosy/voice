import { Text } from "./components/Text";
import { useScrollObserver } from "./hooks/useScrollObserver";
import { useCart } from "./hooks/useCart";
import { useNavigationTree } from "./hooks/useNavigationTree";
import { useDeviceSize } from "./hooks/useDeviceSize";
import { utils } from "./utils";

export const UCP = {
  Text,
  useScrollObserver,
  useCart,
  useNavigationTree,
  useDeviceSize, // 🚀 New!
  utils, // 🚀 New!
};
