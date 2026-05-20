import React, { useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { useApp } from "@/Helpers/AccountDialog";
import { useAppSelector } from "@/app/hooks";
import signOutHandler from "@/app/api/signout";
import { useRouter } from "next/navigation";

const Account = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const { appState } = useApp();
  const router = useRouter();

  const userName = useAppSelector(
    (state) => state.userState.defaultAccount.userName,
  );

  const userRole = useAppSelector(
    (state) => state.userState.defaultAccount.role,
  );

  function signOut() {
    signOutHandler();
    router.push("/signed-out");
  }

  return (
    <div
      onMouseEnter={() => setDropdownVisible(true)}
      onMouseLeave={() => setDropdownVisible(false)}
      className="relative flex h-12 w-12 items-center justify-center"
    >
      <button
        type="button"
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-davysilver transition hover:bg-gray-100"
      >
        <UserIcon className="h-7 w-7" />
      </button>

      {isDropdownVisible && appState.loggedIn && (
        <div
          id="dropdownAvatar"
          className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 overflow-hidden rounded-lg bg-white divide-y divide-gray-100 drop-shadow-custom-xl"
        >
          <div className="px-4 py-3 text-sm text-gray-500">
            <div className="truncate">{userName}</div>
          </div>

          <ul
            className="py-2 text-sm text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownUserAvatarButton"
          >
            <li>
              <a
                href="/account-settings"
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100"
              >
                Settings
              </a>
            </li>

            {userRole === "admin" && (
              <li>
                <a
                  href="/admin"
                  className="block px-4 py-2 text-gray-500 hover:bg-gray-100"
                >
                  Admin Panel
                </a>
              </li>
            )}

            <li>
              <a
                href="/orders"
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100"
              >
                Orders
              </a>
            </li>
          </ul>

          <div className="py-2">
            <button
              type="button"
              onClick={signOut}
              className="block w-full px-4 py-2 text-start text-sm text-gray-400 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {isDropdownVisible && !appState.loggedIn && (
        <div
          id="dropdownAvatar"
          className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 overflow-hidden rounded-lg bg-white divide-y divide-gray-100 drop-shadow-custom-xl"
        >
          <div className="flex gap-2 px-4 py-3 text-sm text-gray-500">
            <div>New User?</div>
            <a href="/sign-up" className="text-primary-800">
              Register
            </a>
          </div>

          <ul
            className="py-2 text-sm text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownUserAvatarButton"
          >
            <li>
              <a
                href="/sign-in"
                className="block px-4 py-2 text-primary-800 hover:bg-gray-100"
              >
                Sign In
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Account;
