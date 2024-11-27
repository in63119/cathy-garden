import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

interface IKakaoState {
  kakaoEmail: string;
  kakaoId: number;
  isLogin: boolean;
}

export const kakaoState = atom<IKakaoState>({
  key: "kakao",
  default: {
    kakaoEmail: "",
    kakaoId: 0,
    isLogin: false,
  },
  effects_UNSTABLE: [persistAtom],
});
