import { useApp } from "@/Helpers/AccountDialog";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../app/hooks";
import { setDefaultAccount } from "@/features/UIUpdates/UserAccount";
import signInHandler from "@/app/api/signin";
import signUpHandler from "@/app/api/signup";
import sessionHandler from "@/app/api/sessionauth";
import authDataHandler from "@/app/api/googleAuth";
import signOutHandler from "@/app/api/signout";

const redirectByRole = (role: string, router: ReturnType<typeof useRouter>) => {
  if (role === "admin") router.push("/admin");
  else if (role === "warehouse_manager") router.push("/admin/warehouse");
  else if (role === "sales_staff") router.push("/admin/sales");
  else router.push("/");
};

const useAuth = () => {
  const { toggleIsIncorrect, toggleIsExists, toggleServerError, setLoggedIn } = useApp();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const saveLoginData = (userData: any) => {
    const data = {
      userID: userData.userID ?? userData.userid,
      userName: userData.userName ?? userData.username,
      email: userData.email,
      mobile_number: userData.mobile_number,
      dob: userData.dob,
      role: userData.role ?? "customer",
    };
    dispatch(setDefaultAccount(data));
    setLoggedIn(true);
    return data;
  };

  const logout = async () => {
    await signOutHandler();
    dispatch(setDefaultAccount({ userID: 0, userName: "", email: "", mobile_number: "", dob: "", role: "customer" }));
    setLoggedIn(false);
    router.replace("/");
    router.refresh();
  };

  const checkLogin = async (
    form: { email: string; password: string },
    remember: boolean,
    setloading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    try {
      const res = await signInHandler({ email: form.email, password: form.password, remember });
      if (res.status === 200) {
        const data = saveLoginData(res.data.userData);
        setloading(false);
        redirectByRole(data.role, router);
        return;
      }
      if (res.status === 205) {
        setloading(false);
        toggleIsIncorrect();
      }
    } catch {
      setloading(false);
      toggleServerError();
    }
  };

  const registerUser = async (
    form: { userName: string; email: string; password: string; mobile_number: number; dob: string },
    promotional: boolean,
    setloading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    try {
      const res = await signUpHandler(form, promotional);
      if (res.status === 200) {
        setloading(false);
        setLoggedIn(true);
        router.push("/");
        return;
      }
      if (res.status === 205) {
        setloading(false);
        toggleIsExists();
      }
    } catch {
      toggleServerError();
    }
  };

  const checkSession = async () => {
    try {
      const res = await sessionHandler();
      if (res.status === 200) {
        const data = saveLoginData(res.data.userData);
        return { success: true, data };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const checkAuthLogin = async (
    authCode: string,
    setloading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    try {
      const res = await authDataHandler(authCode);
      if (res.status === 200) {
        const data = saveLoginData(res.data.userData);
        setloading(false);
        redirectByRole(data.role, router);
        return;
      }
      if (res.status === 205) {
        setloading(false);
        toggleIsIncorrect();
      }
    } catch {
      setloading(false);
      toggleServerError();
    }
  };

  return { checkLogin, registerUser, checkSession, checkAuthLogin, logout };
};

export default useAuth;
