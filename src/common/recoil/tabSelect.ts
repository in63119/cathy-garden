import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const tabSelectState = atom({
  key: "tabSelect",
  default: {
    tabSelect: "NFT",
  },
  effects_UNSTABLE: [persistAtom],
});
