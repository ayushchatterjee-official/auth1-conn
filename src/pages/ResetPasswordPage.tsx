
import { Helmet } from "react-helmet-async";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

const ResetPasswordPage = () => {
  return (
    <>
      <Helmet>
        <title>Reset Password | Auth System</title>
      </Helmet>
      <div className="auth-container">
        <ResetPasswordForm />
      </div>
    </>
  );
};

export default ResetPasswordPage;
