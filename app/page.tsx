import AccountDetailsCard from "./AccountDetailsCard";
import ProfileThemePicker from "./ProfileThemePicker";
import SteamRefreshRequestButton from "./SteamRefreshRequestButton";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 sm:items-start dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl leading-10 font-semibold tracking-tight text-black dark:text-zinc-50">
            Hello, welcome to Steam Toolkit
          </h1>
          <div className="flex gap-4">
            <SteamRefreshRequestButton />
          </div>
          <AccountDetailsCard />
          <ProfileThemePicker />
        </div>
      </main>
    </div>
  );
}
