import ChildProfileForm from "@/components/Profile/ChildProfileForm";

export default function ProfilePage() {
  // Tạm thời dùng userID cố định để test.
  // Sau này có thể thay bằng session hoặc context đăng nhập.
  const userID = 1;

  return (
    <div className="container mx-auto py-8">
      <ChildProfileForm userId={userID} />
    </div>
  );
}