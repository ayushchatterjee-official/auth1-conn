
import { Helmet } from "react-helmet-async";
import ProfileCard from "@/components/profile/ProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Helmet>
        <title>Profile | Auth System</title>
      </Helmet>
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Your Profile</h1>
          <ProfileCard />
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
